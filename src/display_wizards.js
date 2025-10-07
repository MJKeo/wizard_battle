import { useEffect, useMemo, useState } from "react";
import Wizard from "./classes/wizard";
import Spell from "./classes/spell";
import Element from "./enums/element";

const ensureActionInstance = (action) => {
  if (!action) {
    return null;
  }

  if (typeof action.display_card === "function") {
    return action;
  }

  try {
    return Spell.build_from_json({
      name: action.name,
      spell_type: String(action.spell_type ?? action.type ?? "").toUpperCase(),
      description: action.description ?? "",
      element: String(action.element ?? "").toUpperCase(),
      strength: Number(action.strength ?? 0),
    });
  } catch (error) {
    console.error("Failed to coerce action payload into Spell instance", action, error);
    return null;
  }
};

const getActionCardClass = (card) => {
  const type = String(card?.type ?? "").toUpperCase();
  if (type === "HEAL") {
    return "spell-card-heal";
  }
  if (type === "DEFENSE") {
    return "spell-card-defense";
  }
  return "spell-card-spell";
};

const formatAccuracy = (accuracy) => {
  if (typeof accuracy !== "number") {
    return "🎯 ?";
  }
  return `🎯 ${Math.round(accuracy * 100)}%`;
};

const formatRange = (card) => {
  if (!card) {
    return "?";
  }

  const type = String(card.type ?? "").toUpperCase();

  const emoji =
    type === "HEAL"
      ? "🍃"
      : type === "DAMAGE"
      ? "💥"
      : type === "BUFF"
      ? "📈"
      : type === "DEBUFF"
      ? "📉"
      : type === "DEFENSE"
      ? "🛡️"
      : "";

  if (typeof card.range === "string") {
    return `${emoji} ${card.range}`.trim();
  } else if (Array.isArray(card.range) && card.range.length === 2) {
    const [min, max] = card.range;
    return `${emoji} ${min}-${max}`.trim();
  }
};

const STAT_CONFIG = [
  { key: "attack", label: "Attack", color: "#f87171" },
  { key: "defense", label: "Defense", color: "#60a5fa" },
  { key: "healing", label: "Healing", color: "#34d399" },
  { key: "arcane", label: "Arcane", color: "#c084fc" },
];

function DisplayWizards({
  descriptions,
  apiBaseUrl,
  onReset,
  onBeginBattle = () => {},
  onWizardReady,
  playerOneWizard,
  playerTwoWizard,
}) {
  const [results, setResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setResults([]);
      setErrorMessage("");

      const { playerOne, playerTwo } = descriptions;
      const entries = [
        { label: "Player 1", description: playerOne },
        { label: "Player 2", description: playerTwo },
      ];

      const appendResult = (label, updates) => {
        setResults((prev) => {
          const existing = prev.find((entry) => entry.label === label);
          if (existing) {
            return prev.map((entry) =>
              entry.label === label ? { ...entry, ...updates } : entry
            );
          }
          return [...prev, { label, ...updates }];
        });
      };

      try {
        await Promise.all(
          entries.map(async ({ label, description }) => {
            const statsResponse = await fetch(`${apiBaseUrl}/generate_wizard_stats`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ description }),
            });

            if (!statsResponse.ok) {
              throw new Error(`${label} wizard stats failed with status ${statsResponse.status}`);
            }

            const statsData = await statsResponse.json();
            appendResult(label, { stats: statsData, description });

            let spellsData = [];
            let attempt = 0;

            while (attempt < 3) {
              const spellsResponse = await fetch(`${apiBaseUrl}/generate_spells`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  description,
                  name: statsData.name,
                  primary_element: statsData.primary_element,
                  secondary_element: statsData.secondary_element,
                  combat_style: statsData.combat_style,
                }),
              });

              if (!spellsResponse.ok) {
                throw new Error(`${label} spell generation failed with status ${spellsResponse.status}`);
              }

              const maybeSpells = await spellsResponse.json();
              if (Array.isArray(maybeSpells) && maybeSpells.length >= 4) {
                spellsData = maybeSpells;
                break;
              }

              attempt += 1;

              if (attempt >= 3) {
                throw new Error(`${label} spell generation returned fewer than 4 spells after ${attempt} attempts`);
              }
            }

            let wizardInstance = null;
            try {
              const spellInstances = spellsData.map((spell) =>
                Spell.build_from_json({
                  name: spell.name,
                  spell_type: String(spell.spell_type ?? spell.type ?? "").toUpperCase(),
                  description: spell.description ?? "",
                  element: String(spell.element ?? ""),
                  strength: Number(spell.strength ?? 0),
                })
              );

              wizardInstance = new Wizard(
                statsData.name,
                Element.fromName(statsData.primary_element),
                Element.fromName(statsData.secondary_element),
                Number(statsData.attack),
                Number(statsData.defense),
                Number(statsData.health),
                Number(statsData.healing),
                Number(statsData.arcane),
                spellInstances,
                statsData.combat_style
              );
            } catch (wizardError) {
              console.error(`Failed to build wizard for ${label}`, wizardError);
            }

            appendResult(label, { spells: spellsData, wizard: wizardInstance });
            if (wizardInstance && onWizardReady) {
              onWizardReady(label, wizardInstance);
            }
          })
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `Failed to generate wizards or spells. ${error.message}`
            : "Failed to generate wizards or spells."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [descriptions, apiBaseUrl]);

  const playersByLabel = useMemo(() => ({
    "Player 1": playerOneWizard,
    "Player 2": playerTwoWizard,
  }), [playerOneWizard, playerTwoWizard]);

  useEffect(() => {
    if (!onWizardReady) {
      return;
    }

    results.forEach(({ label, stats, spells }) => {
      if (!stats || !spells) {
        return;
      }

      if (playersByLabel[label]) {
        return;
      }

      const wizardInstance = new Wizard(
        stats.name,
        Element.fromName(stats.primary_element),
        Element.fromName(stats.secondary_element),
        stats.attack,
        stats.defense,
        stats.health,
        stats.healing,
        stats.arcane,
        spells.map((spell) =>
          new Spell(
            spell.name,
            spell.spell_type ? spell.spell_type : spell.type,
            spell.description ?? "",
            Element.fromName(spell.element),
            spell.strength
          )
        ),
        stats.combat_style
      );

      onWizardReady(label, wizardInstance);
    });
  }, [results, onWizardReady, playersByLabel]);

  const allComplete =
    results.length === 2 && results.every((entry) => entry.stats && entry.spells);

  return (
    <section className="wizard-section">
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {(!allComplete || isLoading) && (
        <div className="summary-header">
          <h2 className="summary-title">
            {isLoading && !allComplete ? "generating wizards..." : "Your wizards are ready for combat!"}
          </h2>
        </div>
      )}

      <div className={`wizard-actions-header${allComplete ? " wizard-actions-header--complete" : ""}`}>
        {allComplete && (
          <button
            className="prompt-button"
            type="button"
            onClick={onBeginBattle}
            disabled={!(playerOneWizard && playerTwoWizard)}
            title={playerOneWizard && playerTwoWizard ? "" : "Both wizards must finish loading"}
          >
            Begin Battle
          </button>
        )}
      </div>

      <div className="wizard-grid">
        {["Player 1", "Player 2"].map((label) => {
          const record = results.find((entry) => entry.label === label);
          if (!record) {
            return (
              <article key={label} className="wizard-card">
                <header className="wizard-header">
                  <p className="wizard-label">{label}</p>
                  <p className="loading-message">Awaiting wizard...</p>
                </header>
              </article>
            );
          }

          const { stats, spells, wizard: localWizard } = record;
          const wizardFromProps = label === "Player 1" ? playerOneWizard : playerTwoWizard;
          const wizard = wizardFromProps ?? localWizard;
          const displayStats = wizard ?? stats;

          const name = wizard ? wizard.name : stats?.name;
          const combatStyle = wizard ? wizard.combat_style : stats?.combat_style;
          const primaryElement = wizard
            ? wizard.primary_element?.name
            : stats?.primary_element;
          const secondaryElement = wizard
            ? wizard.secondary_element?.name
            : stats?.secondary_element;
          const rawActions = wizard
            ? wizard.all_actions()
            : (spells ?? []).map((spell) => ensureActionInstance(spell)).filter(Boolean);

          const actionsToShow = rawActions
            .map((action) => ({ action, card: ensureActionInstance(action)?.display_card?.() ?? action?.display_card?.() }))
            .map(({ action, card }) => {
              if (!card) {
                return { action, card: null };
              }

              if (String(card.type ?? "").toUpperCase() === "DEFENSE") {
                return {
                  action,
                  card: { ...card, name: "Shield" },
                };
              }

              return { action, card };
            })
            .filter(({ card }) => card !== null)
            .sort((a, b) => {
              const typeOrder = { DAMAGE: 0, BUFF: 1, DEBUFF: 2, DEFENSE: 3, DEFEND: 3, HEAL: 4 };
              const aType = String(a.card.type ?? "").toUpperCase();
              const bType = String(b.card.type ?? "").toUpperCase();
              const orderDiff = (typeOrder[aType] ?? 99) - (typeOrder[bType] ?? 99);
              if (orderDiff !== 0) {
                return orderDiff;
              }
              return String(a.card.name ?? "").localeCompare(String(b.card.name ?? ""));
            });

          return (
            <article key={label} className="wizard-card">
            <header className="wizard-header">
              <p className="wizard-label">{label}</p>
              {displayStats ? (
                <>
                  <h3 className="wizard-name">{name}</h3>
                  <p className="wizard-style">{combatStyle}</p>
                  <div className="element-tags">
                    <span className={`element-pill element-${primaryElement?.toLowerCase()}`}>
                      {primaryElement}
                    </span>
                    <span className={`element-pill element-${secondaryElement?.toLowerCase()}`}>
                      {secondaryElement}
                    </span>
                  </div>
                </>
              ) : (
                <p className="loading-message">Awaiting stats...</p>
              )}
            </header>

            {displayStats && (
              <section className="wizard-stats">
                {STAT_CONFIG.map(({ key, label: statLabel, color }) => (
                  <div key={key} className="stat-row">
                    <span className="stat-label">{statLabel}</span>
                    <div className="stat-meter">
                      <div
                        className="stat-meter__fill"
                        style={{
                          width: `${Math.min(Math.max(displayStats?.[key] ?? 0, 0), 1) * 100}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </section>
            )}

            {actionsToShow.length > 0 && (
              <section className="wizard-spells">
                <h4 className="summary-subtitle">Spells</h4>
                <div className="spell-cards">
                  {actionsToShow.map(({ card }, index) => {
                    const cardClassName = getActionCardClass(card);

                    if (!card) {
                      return null;
                    }

                    const accuracyLabel = formatAccuracy(card.accuracy);
                    const manaCostLabel = `🔮 ${card.mana_cost ?? "?"}`;
                    const rangeLabel = formatRange(card);
                    const description = card.description ?? "";
                    const elementLabel = card.element ?? null;
                    const elementClass = elementLabel
                      ? `element-pill element-${String(card.element ?? "generic").toLowerCase()}`
                      : null;
                    const spellToneClass =
                      cardClassName === "spell-card-spell" && index < 4
                        ? `spell-card-spell-${index}`
                        : "";

                    return (
                      <div
                        key={`${card.name}-${index}`}
                        className={`spell-card spell-card--static ${cardClassName} ${spellToneClass}`.trim()}
                      >
                        <div className="spell-card__row spell-card__row--primary">
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
                        <div className="spell-card__row spell-card__row--description spell-card__row--description--static">
                          {description && (
                            <span className="spell-card__description"><em>{description}</em></span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            </article>
          );
        })}
      </div>

      <div className="wizard-footer-actions">
        {allComplete && (
          <button
            className="prompt-button prompt-button--full"
            type="button"
            onClick={onBeginBattle}
            disabled={!(playerOneWizard && playerTwoWizard)}
            title={playerOneWizard && playerTwoWizard ? "" : "Both wizards must finish loading"}
          >
            Begin Battle
          </button>
        )}
        <button className="prompt-button button-outline prompt-button--full" type="button" onClick={onReset}>
          Start Over
        </button>
      </div>

    </section>
  );
}

export default DisplayWizards;
