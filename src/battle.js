import { useCallback, useEffect, useRef, useState } from "react";
import { GameState } from "./classes/gameState";
import { combatSystemPrompt, combatSystemPromptV2, combatUserPromptV2 } from "./prompts/prompts";
import BattleLogMessageType from "./enums/battleLogMessageType";
import ActionType from "./enums/actionType";
import SpellType from "./enums/spellType";

const formatActions = (wizard, currentMana) => {
  if (!wizard) {
    return [];
  }

  const availableMana = Number.isFinite(currentMana) ? currentMana : 0;
  const actions = wizard.all_actions?.() ?? [];

  return actions.map((action, index) => {
    const card = action.display_card?.();
    if (!card) {
      return null;
    }

    const manaCost = typeof action.mana_cost === "function" ? action.mana_cost() : card.mana_cost;
    const isAffordable = Number.isFinite(manaCost) ? manaCost <= availableMana : true;

    const type = String(card.type ?? "").toUpperCase();
    const manaCostLabel = `🔮 ${card.mana_cost ?? "?"}`;
    const emoji =
      type === "DAMAGE"
        ? "💥"
        : type === "BUFF"
        ? "📈"
        : type === "DEBUFF"
        ? "📉"
        : type === "HEAL"
        ? "🍃"
        : type === "DEFENSE"
        ? "🛡️"
        : "";

    const rangeLabel = (() => {
      if (Array.isArray(card.range) && card.range.length === 2) {
        const [min, max] = card.range;
        return `${emoji} ${min}-${max}`.trim();
      }
      if (typeof card.range === "string") {
        return `${emoji} ${card.range}`.trim();
      }
      return emoji;
    })();

    const accuracyLabel = typeof card.accuracy === "number" ? `🎯 ${Math.round(card.accuracy * 100)}%` : "🎯 ?";
    const elementLabel = card.element ?? null;
    const elementClass = elementLabel ? `element-pill element-${String(elementLabel).toLowerCase()}` : null;
    const description = card.description ?? "";

    const cardClassName = [
      "spell-card",
      type === "HEAL"
        ? "spell-card-heal"
        : type === "DEFENSE"
        ? "spell-card-defense"
        : "spell-card-spell",
      !isAffordable ? "spell-card--unavailable" : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div key={`${card.name}-${index}`} className={cardClassName}>
        <div className="spell-card__row">
          <div className="spell-card__primary-left">
            {elementClass && <span className={elementClass}>{elementLabel}</span>}
            <span className="spell-card__name">{card.name}</span>
          </div>
          <div className="spell-card__primary-right">
            <span className="spell-card__meta spell-card__meta--range">{rangeLabel}</span>
            <span className="spell-card__meta">{accuracyLabel}</span>
            <span className="spell-card__meta">{manaCostLabel}</span>
          </div>
        </div>
        {description && (
          <div className="spell-card__row spell-card__row--description">
            <span className="spell-card__description">{description}</span>
          </div>
        )}
      </div>
    );
  });
};

const formatActiveEffects = (wizardState) => {
  const effects = wizardState.active_effects ?? [];
  if (!effects.length) {
    return [{ text: "(none)", title: "" }];
  }

  return effects.map((effect) => {
    const rounds = effect.remaining_turns ?? effect.rounds_remaining ?? 0;
    const type = String(effect.effect_type ?? effect.type ?? "").toUpperCase();
    const sourceName = effect.source_name ?? effect.source ?? effect.name ?? "Effect";
    if (type === "DEFENSE" || (effect.is_defense && typeof effect.is_defense === "boolean")) {
      return {
        text: `🛡️ ${effect.name ?? "Unknown"} (${rounds})`,
        title: sourceName,
      };
    }

    const effectValue = Number(effect.value ?? 0) || 0;
    const percent = `${(Math.round(effectValue * 1000) / 10).toFixed(1)}%`;

    if (type === "BUFF" || effect.is_buff) {
      return {
        text: `📈 ${percent} (${rounds})`,
        title: sourceName,
      };
    }

    if (type === "DEBUFF" || effect.is_debuff) {
      return {
        text: `📉 ${percent} (${rounds})`,
        title: sourceName,
      };
    }

    return {
      text: `${effect.name ?? "Effect"} (${rounds})`,
      title: sourceName,
    };
  });
};

const StatCircles = ({ current, max, color }) => {
  const clampedCurrent = Math.max(0, current);
  const clampedMax = Math.max(1, max);
  const percent = Math.max(0, Math.min(1, clampedCurrent / clampedMax));

  return (
    <div className="stat-horizontal">
      <div className="stat-horizontal__meter">
        <div
          className="stat-horizontal__fill"
          style={{ width: `${percent * 100}%`, backgroundColor: color }}
        >
          <span className="stat-horizontal__value">{`${clampedCurrent}/${clampedMax}`}</span>
        </div>
      </div>
    </div>
  );
};

const HorizontalStatBars = ({ state }) => {
  const stats = [
    { key: "attack", label: "Attack", color: "#f87171" },
    { key: "defense", label: "Defense", color: "#60a5fa" },
    { key: "healing", label: "Healing", color: "#34d399" },
    { key: "arcane", label: "Arcane", color: "#c084fc" },
  ];

  return (
    <div className="stat-bars">
      {stats.map(({ key, label, color }) => {
        const rawValue = Math.min(1, Math.max(0, state.player.wizard[key] ?? 0));
        const percent = Math.round(rawValue * 100);

        return (
          <div key={key} className="stat-row">
            <span className="stat-label">{label}</span>
            <div className="stat-meter">
              <div
                className="stat-meter__fill"
                style={{ width: `${percent}%`, backgroundColor: color }}
              >
                <span className="stat-meter__value">{percent}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const BattleColumn = ({ actions, wizardState, description }) => (
  <section className="battle-column">
    <header className="battle-column__header">
      <div className="battle-wizard-name">
        <h2>{wizardState.player.wizard.name}</h2>
        {(() => {
          const combatStyle = wizardState.player?.wizard?.combat_style;
          const hasTooltipContent = Boolean(description || combatStyle);
          if (!hasTooltipContent) {
            return null;
          }
          return (
            <>
              <span className="tooltip-trigger">?</span>
              <div className="tooltip-content">
                {combatStyle && (
                  <>
                    <strong>Combat Style</strong>
                    <br />
                    <span>{combatStyle}</span>
                    {description && <br />}
                    {description && <br />}
                  </>
                )}
                {description && (
                  <>
                    <strong>Original Description</strong>
                    <br />
                    <span>{description}</span>
                  </>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </header>
    <div className="battle-column__content">
      <div className="battle-stats">
        <div className="battle-stats__resource-bars">
          <div className="battle-stats__resource">
            <span className="battle-stats__resource-label">Health</span>
            <StatCircles current={wizardState.current_health} max={wizardState.max_health} color="#b91c1c" />
          </div>
          <div className="battle-stats__resource">
            <span className="battle-stats__resource-label">Mana</span>
            <StatCircles current={wizardState.current_mana} max={25} color="#a855f7" />
          </div>
        </div>
        <div className="battle-stats__effects">
          <h4 className="battle-section-title">Active Effects</h4>
          <p className="battle-effects__list">
            {formatActiveEffects(wizardState)
              .map(({ text, title }, index) => (
                <span key={`${text}-${index}`} title={title}>
                  {text}
                  {index < (wizardState.active_effects?.length ?? 0) - 1 ? ", " : ""}
                </span>
              ))}
          </p>
        </div>
        <div className="battle-stats__bars">
          <h4 className="battle-section-title">Stats</h4>
          <HorizontalStatBars state={wizardState} />
        </div>
      </div>
      <div className="battle-actions">
        <h4 className="battle-section-title battle-section-title--spells">Spells</h4>
        <div className="spell-cards">{actions}</div>
      </div>
    </div>
  </section>
);

const Battle = ({ playerOneWizard, playerTwoWizard, onReset, apiBaseUrl, descriptions }) => {
  const gameStateRef = useRef(null);
  const controllerRef = useRef(null);
  const cancelledRef = useRef(false);
  const baseUrlRef = useRef(apiBaseUrl ?? "http://localhost:3167");
  const actingIndexRef = useRef(0);
  const turnRef = useRef(1);

  const autoProgressRef = useRef(false);
  const isFetchingActionRef = useRef(false);
  const pendingActionRef = useRef(null);
  const winnerRef = useRef(null);
  const isExecutingActionRef = useRef(false);
  const [generatingWizardName, setGeneratingWizardName] = useState(null);
  const descriptionsRef = useRef({ playerOne: "", playerTwo: "" });

  useEffect(() => {
    descriptionsRef.current = {
      playerOne: descriptions?.playerOne ?? descriptionsRef.current.playerOne ?? "",
      playerTwo: descriptions?.playerTwo ?? descriptionsRef.current.playerTwo ?? "",
    };
  }, [descriptions]);

  const [playerStates, setPlayerStates] = useState([]);
  const [battleLog, setBattleLog] = useState([]);
  const [winner, setWinner] = useState(null);
  const [autoProgress, setAutoProgress] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isFetchingAction, setIsFetchingAction] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [shouldAutoResolve, setShouldAutoResolve] = useState(false);

  useEffect(() => {
    baseUrlRef.current = apiBaseUrl ?? "http://localhost:3167";
  }, [apiBaseUrl]);

  useEffect(() => {
    autoProgressRef.current = autoProgress;
  }, [autoProgress]);

  useEffect(() => {
    pendingActionRef.current = pendingAction;
  }, [pendingAction]);

  useEffect(() => {
    isFetchingActionRef.current = isFetchingAction;
  }, [isFetchingAction]);

  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  useEffect(() => {
    isExecutingActionRef.current = isExecutingAction;
  }, [isExecutingAction]);

  const appendToLog = useCallback((entry) => {
    if (cancelledRef.current) {
      return;
    }
    setBattleLog((prev) => [entry, ...prev]);
  }, []);

  const fetchActionForCurrentActor = useCallback(
    async function fetchAction(autoExecute = false) {
      if (
        cancelledRef.current ||
        winnerRef.current ||
        isFetchingActionRef.current ||
        pendingActionRef.current
      ) {
        return;
      }

      const currentState = gameStateRef.current;
      if (!currentState) {
        return;
      }

      const actingIndex = actingIndexRef.current;
      const actingState = currentState.player_states?.[actingIndex];
      const enemyState = currentState.player_states?.[1 - actingIndex];

      if (!actingState || !enemyState) {
        appendToLog({ type: BattleLogMessageType.ERROR, message: "Invalid game state" });
        return;
      }

      const validActions = currentState.affordable_actions(actingIndex) ?? [];

      if (!validActions.length) {
        appendToLog({ type: BattleLogMessageType.ERROR, message: "No valid actions available. Skipping turn." });

        const manaBefore = actingIndex === 1
          ? currentState.player_states.map((state) => state.current_mana)
          : null;
        currentState.increment_mana?.();
        const updatedStates = [...currentState.player_states];
        setPlayerStates(updatedStates);

        if (actingIndex === 1 && manaBefore) {
          const manaGains = updatedStates.map((state, idx) => Math.max(0, state.current_mana - manaBefore[idx]));
          appendToLog({
            type: BattleLogMessageType.TURN_END,
            message: `End turn ${turnRef.current}, ${updatedStates[0].player.wizard.name} gets ${manaGains[0]} mana, ${updatedStates[1].player.wizard.name} gets ${manaGains[1]} mana\n`,
          });
        }

        actingIndexRef.current = 1 - actingIndex;
        if (actingIndex === 1) {
          turnRef.current += 1;
        }

        const winnerAfterSkip = currentState.get_winner?.();
        if (winnerAfterSkip) {
          winnerRef.current = winnerAfterSkip;
          setWinner(winnerAfterSkip);
          appendToLog({ type: BattleLogMessageType.WINNER, message: `${winnerAfterSkip.name} wins!` });
          return;
        }

        return fetchAction(autoExecute);
      }

      setIsFetchingAction(true);
      isFetchingActionRef.current = true;
      setPendingAction(null);
      pendingActionRef.current = null;
      setGeneratingWizardName(actingState.player.wizard.name);

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const battleContext = currentState.compact_battle_context(actingIndex);
        const system_prompt = combatSystemPromptV2(actingState.player.wizard)
        const user_prompt = combatUserPromptV2(actingState.player.wizard, battleContext['actor_info'], battleContext['enemy_info'])
        console.log(user_prompt)
        const response = await fetch(`${baseUrlRef.current}/generate_action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_prompt: system_prompt,
            user_prompt: user_prompt,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to generate action (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        console.log(data['justification'])
        const rawAction = data?.action_index;
        const parsedIndex =
          typeof rawAction === "number" ? rawAction : Number.parseInt(rawAction, 10);

        if (!Number.isFinite(parsedIndex)) {
          appendToLog({ type: BattleLogMessageType.ERROR, message:`Invalid action index returned: ${JSON.stringify(data)}`});
          return;
        }

        const adjustedIndex = parsedIndex - 1;
        if (adjustedIndex < 0 || adjustedIndex >= validActions.length) {
          appendToLog({ type: BattleLogMessageType.ERROR, message: `Action index ${parsedIndex} is out of bounds for ${validActions.length} actions` });
          return;
        }

        const selectedAction = validActions[adjustedIndex];
        const turnData = {
          actingIndex,
          turn: turnRef.current,
          actingWizardName: actingState.player.wizard.name,
          selectedAction,
          actionName:
            selectedAction?.name ?? selectedAction?.constructor?.name ?? "Action",
        };

        pendingActionRef.current = turnData;
        setPendingAction(turnData);
        setShouldAutoResolve(autoExecute || autoProgressRef.current);
      } catch (error) {
        if (error?.name === "AbortError" || cancelledRef.current) {
          return;
        }

        appendToLog({ type: BattleLogMessageType.ERROR, message: `Error during action generation: ${String(error)}` });
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }

        isFetchingActionRef.current = false;
        setIsFetchingAction(false);
        setGeneratingWizardName(null);
      }
    },
    [appendToLog, setPlayerStates, setWinner]
  );

  const executeAction = useCallback(
    (actionData) => {
      if (!actionData || cancelledRef.current || winnerRef.current || isExecutingActionRef.current) {
        return;
      }

      const currentState = gameStateRef.current;
      if (!currentState) {
        return;
      }

      setShouldAutoResolve(false);
      setPendingAction(null);
      pendingActionRef.current = null;

      setIsExecutingAction(true);
      isExecutingActionRef.current = true;

      let continueBattle = true;

      try {
        if (actionData.actingIndex === 0) {
          appendToLog({ type: BattleLogMessageType.TURN_START, message: `Turn ${actionData.turn}` });
        }

        const announcement =
          currentState.perform_action(actionData.actingIndex, actionData.selectedAction) ?? "";

        setPlayerStates([...currentState.player_states]);

        var action_emoji = "🪄";
        switch (actionData.selectedAction.action_type.name) {
          case "HEAL":
            action_emoji = "🍃";
            break;
          case "DEFEND":
            action_emoji = "🛡️";
            break;
          case "CAST_SPELL":
            switch(actionData.selectedAction.spell_type) {
                case SpellType.DAMAGE:
                    action_emoji = "💥";
                    break;
                case SpellType.BUFF:
                    action_emoji = "📈";
                    break;
                case SpellType.DEBUFF:
                    action_emoji = "📉";
                    break;
            }
            break;
          case "PASS":
            action_emoji = "✋";
            break;
        }
        appendToLog({ type: BattleLogMessageType.PLAYER_ACTION, message: `${action_emoji} ${announcement}\n` });

        const winnerAfterAction = currentState.get_winner?.();
        if (winnerAfterAction) {
          winnerRef.current = winnerAfterAction;
          continueBattle = false;
          setWinner(winnerAfterAction);
          appendToLog({ type: BattleLogMessageType.WINNER, message: `${winnerAfterAction.name} wins!` });
        } else {
          actingIndexRef.current = 1 - actionData.actingIndex;
          if (actingIndexRef.current === 0) {
            const manaBefore = currentState.player_states.map((state) => state.current_mana);
            currentState.increment_mana?.();
            const updatedStates = [...currentState.player_states];
            setPlayerStates(updatedStates);
            const manaGains = updatedStates.map((state, idx) => Math.max(0, state.current_mana - manaBefore[idx]));
            appendToLog({
              type: BattleLogMessageType.TURN_END,
              message: `End turn ${actionData.turn}, ${updatedStates[0].player.wizard.name} gets ${manaGains[0]} mana, ${updatedStates[1].player.wizard.name} gets ${manaGains[1]} mana\n`,
            });
            turnRef.current = actionData.turn + 1;
          }
        }
      } catch (error) {
        continueBattle = false;
        appendToLog({ type: BattleLogMessageType.ERROR, message: `Action failed: ${String(error)}` });
      } finally {
        setIsExecutingAction(false);
        isExecutingActionRef.current = false;

        if (continueBattle && !cancelledRef.current) {
          fetchActionForCurrentActor(autoProgressRef.current);
        }
      }
    },
    [appendToLog, fetchActionForCurrentActor]
  );

  useEffect(() => {
    if (!pendingAction || winnerRef.current || isExecutingActionRef.current) {
      return;
    }

    if (shouldAutoResolve || autoProgress) {
      setShouldAutoResolve(false);
      executeAction(pendingAction);
    }
  }, [pendingAction, shouldAutoResolve, autoProgress, executeAction]);

  useEffect(() => {
    if (!pendingAction && shouldAutoResolve) {
      setShouldAutoResolve(false);
    }
  }, [pendingAction, shouldAutoResolve]);

  useEffect(() => {
    if (!autoProgress || winnerRef.current) {
      return;
    }
    if (pendingActionRef.current || isFetchingActionRef.current) {
      return;
    }
    fetchActionForCurrentActor(true);
  }, [autoProgress, fetchActionForCurrentActor]);

  useEffect(() => {
    if (!playerOneWizard || !playerTwoWizard) {
      return undefined;
    }

    cancelledRef.current = false;
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }

    const state = new GameState();
    state.initialize(playerOneWizard, playerTwoWizard);
    gameStateRef.current = state;

    actingIndexRef.current = 0;
    turnRef.current = 1;

    winnerRef.current = null;
    autoProgressRef.current = false;
    pendingActionRef.current = null;
    isFetchingActionRef.current = false;
    isExecutingActionRef.current = false;

    setPlayerStates([...state.player_states]);
    setBattleLog([]);
    setWinner(null);
    setAutoProgress(false);
    setPendingAction(null);
    setIsFetchingAction(false);
    setIsExecutingAction(false);
    setShouldAutoResolve(false);

    fetchActionForCurrentActor(true);

    return () => {
      cancelledRef.current = true;
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
    };
  }, [playerOneWizard, playerTwoWizard, fetchActionForCurrentActor]);

  const handleNextMove = useCallback(() => {
    if (
      !pendingAction ||
      autoProgress ||
      winner ||
      isFetchingAction ||
      isExecutingAction ||
      cancelledRef.current
    ) {
      return;
    }

    executeAction(pendingAction);
  }, [pendingAction, autoProgress, winner, isFetchingAction, isExecutingAction, executeAction]);

  const toggleAutoProgress = useCallback(() => {
    if (winner) {
      return;
    }
    setAutoProgress((prev) => {
      const nextValue = !prev;
      if (!nextValue) {
        const actionData = pendingActionRef.current;
        if (
          actionData &&
          !winnerRef.current &&
          !isFetchingActionRef.current &&
          !isExecutingActionRef.current
        ) {
          setPendingAction(actionData);
        }
      } else if (!pendingActionRef.current && !isFetchingActionRef.current) {
        fetchActionForCurrentActor(true);
      }
      return nextValue;
    });
  }, [winner, fetchActionForCurrentActor]);

  const playerOneState = playerStates[0] ?? null;
  const playerTwoState = playerStates[1] ?? null;

  const playerOneDescription = playerOneState?.player?.wizard?.original_description ?? descriptionsRef.current.playerOne;
  const playerTwoDescription = playerTwoState?.player?.wizard?.original_description ?? descriptionsRef.current.playerTwo;

  const nextMoveDisabled =
    !!winner || autoProgress || isFetchingAction || isExecutingAction || !pendingAction;
  const autoProgressDisabled = !!winner;
  const autoProgressButtonClass = `prompt-button battle-controls__secondary ${
    autoProgress ? "" : "button-outline"
  }`;
  const nextMoveLabel = !autoProgress && isFetchingAction ? "Generating move..." : "Next Move";

  return (
    <section className="battle-layout">
      {playerOneState && (
        <BattleColumn
          wizardState={playerOneState}
          actions={formatActions(playerOneState.player.wizard, playerOneState.current_mana)}
          description={playerOneDescription}
        />
      )}

      <section className="battle-log">
        <button className="prompt-button button-outline battle-reset" type="button" onClick={onReset}>
          Start Over
        </button>
        <div className="battle-controls">
          <button
            className="prompt-button battle-controls__primary"
            type="button"
            onClick={handleNextMove}
            disabled={nextMoveDisabled}
          >
            {nextMoveLabel}
          </button>
          <button
            className={autoProgressButtonClass}
            type="button"
            onClick={toggleAutoProgress}
            disabled={autoProgressDisabled}
          >
            {`Auto Progress: ${autoProgress ? "On" : "Off"}`}
          </button>
        </div>
        <div className="battle-log__content">
          <h2>Battle Log</h2>
          {autoProgress && isFetchingAction && generatingWizardName && (
            <p className="battle-log__status">{`Generating ${generatingWizardName}'s move...`}</p>
          )}
          {battleLog.length === 0 ? (
            <p className="battle-log__empty">
              {isFetchingAction ? "Resolving first move..." : "Waiting for battle events..."}
            </p>
          ) : (
            battleLog.map((entry, index) => {

                var entryClass = "battle-log__entry";
                switch (entry.type) {
                    case BattleLogMessageType.PLAYER_ACTION:
                        entryClass = "battle-log__entry";
                        break;
                    case BattleLogMessageType.WINNER:
                        entryClass = "battle-log__entry--WINNER";
                        break;
                    case BattleLogMessageType.TURN_START:
                        entryClass = "battle-log__entry--turn-start";
                        break;
                    case BattleLogMessageType.TURN_END:
                        entryClass = "battle-log__entry--turn-end";
                        break;
                    case BattleLogMessageType.ERROR:
                        entryClass = "battle-log__entry--error";
                        break;
                }

              return (
                <div key={index}>
                  <h1 className={entryClass}>{entry.message}</h1>
                </div>
              );
            })
          )}
        </div>
      </section>

      {playerTwoState && (
        <BattleColumn
          wizardState={playerTwoState}
          actions={formatActions(playerTwoState.player.wizard, playerTwoState.current_mana)}
          description={playerTwoDescription}
        />
      )}
    </section>
  );
};

export default Battle;
