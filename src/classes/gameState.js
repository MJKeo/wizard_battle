import ActionType from "../enums/actionType";
import ActionTarget from "../enums/actionTarget";
import SpellType from "../enums/spellType";
import StatusEffectType from "../enums/statusEffectType";
import EffectGroup from "../enums/effectGroup";
import Player from "./player";
import PlayerState from "./playerState";
import StatusEffect from "./statusEffect";
import ActionRecord from "./actionRecord";
import Element from "../enums/element";

const shuffle = (array, randomFn = Math.random) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

class GameState {
  constructor() {
    this.player_states = [];
    this.action_log = [];
  }

  initialize(wizard1, wizard2, randomFn = Math.random) {
    const assigned_order = shuffle([wizard1, wizard2], randomFn);
    this.player_states = assigned_order.map((wizard, index) => {
      const max_hp = wizard.max_hp(randomFn);
      return new PlayerState(
        new Player(index, wizard),
        max_hp,
        max_hp,
        wizard.starting_mana(randomFn),
        []
      );
    });

    this.action_log = [];
    return this.player_states.map((state) => state.player.wizard);
  }

  change_health(player, delta) {
    const state = this.player_states[player.id];
    state.current_health = Math.max(0, Math.min(state.max_health, state.current_health + delta));
    return state.current_health;
  }

  set_health(player, value) {
    const state = this.player_states[player.id];
    state.current_health = Math.max(0, Math.min(state.max_health, value));
    return state.current_health;
  }

  change_mana(player, delta) {
    const state = this.player_states[player.id];
    state.current_mana = Math.max(0, Math.min(25, state.current_mana + delta));
    return state.current_mana;
  }

  set_mana(player, value) {
    const state = this.player_states[player.id];
    state.current_mana = Math.max(0, Math.min(25, value));
    return state.current_mana;
  }

  add_status_effect(player, effect) {
    const state = this.player_states[player.id];
    const existing = state.active_effects.find((active) => active.name === effect.name);
    if (existing) {
      existing.remaining_turns = effect.remaining_turns;
      existing.value = effect.value;
      existing.effect_type = effect.effect_type;
      return;
    }
    state.active_effects.push(effect);
  }

  clear_expired_effects(player) {
    const state = this.player_states[player.id];
    state.active_effects = state.active_effects.filter((effect) => effect.remaining_turns > 0);
  }

  tick_effects() {
    this.player_states.forEach((state) => {
      state.active_effects.forEach((effect) => {
        effect.remaining_turns = Math.max(0, effect.remaining_turns - 1);
      });
    });
  }

  log_action(record) {
    this.action_log.push(record);
  }

  perform_action(actor_index, action, randomFn = Math.random) {
    if (actor_index !== 0 && actor_index !== 1) {
      throw new Error("actor_index must be 0 or 1");
    }

    const actor_state = this.player_states[actor_index];
    const defender_state = this.player_states[1 - actor_index];

    const mana_cost = action.mana_cost();

    if (mana_cost > actor_state.current_mana) {
      throw new Error("Not enough mana to perform action");
    }

    actor_state.current_mana = Math.max(0, actor_state.current_mana - mana_cost);

    const result = action.perform_action(randomFn);

    if (!result?.succeeded) {
      this.log_action(new ActionRecord(actor_index, action.action_type, action.action_target(), "Failed :("));
      this._decay_effects(actor_index);
      return action.failure_announcement(actor_state.player.wizard);
    }

    let final_action_value = result.value;

    switch (result.action_type) {
      case ActionType.HEAL: {
        const healed = this._apply_heal(actor_state, Number(result.value));
        final_action_value = healed;
        this.log_action(new ActionRecord(actor_index, ActionType.HEAL, ActionTarget.SELF, `Healed ${healed}`));
        break;
      }
      case ActionType.DEFEND: {
        this._apply_status(
          actor_state,
          new StatusEffect(
            action.element.name,
            StatusEffectType.DEFENSE,
            0.0,
            3
          )
        );
        this.log_action(new ActionRecord(actor_index, ActionType.DEFEND, ActionTarget.SELF, `Raised ${action.element.name} shield`));
        break;
      }
      case ActionType.CAST_SPELL: {
        switch (result.spell_type) {
          case SpellType.DAMAGE: {
            const damage = this._calculate_damage(actor_state, defender_state, action, Number(result.value));
            this._apply_damage(defender_state, damage);
            final_action_value = damage;
            this.log_action(new ActionRecord(actor_index, ActionType.CAST_SPELL, ActionTarget.ENEMY, `Dealt ${damage}`));
            break;
          }
          case SpellType.BUFF: {
            this._apply_status(
              actor_state,
              new StatusEffect(
                action.name,
                StatusEffectType.BUFF,
                Number(result.value),
                4
              )
            );
            this.log_action(new ActionRecord(actor_index, ActionType.CAST_SPELL, ActionTarget.SELF, `Buff ${action.name}`));
            break;
          }
          case SpellType.DEBUFF: {
            this._apply_status(
              defender_state,
              new StatusEffect(
                action.name,
                StatusEffectType.DEBUFF,
                Number(result.value),
                3
              )
            );
            this.log_action(new ActionRecord(actor_index, ActionType.CAST_SPELL, ActionTarget.ENEMY, `Debuff ${action.name}`));
            break;
          }
          default:
            throw new Error(`Unhandled spell type: ${result.spell_type}`);
        }
        break;
      }
      case ActionType.PASS: {
        this.log_action(new ActionRecord(actor_index, ActionType.PASS, ActionTarget.SELF, `Passed`));
        break;
      }
      default:
        throw new Error(`Unhandled action type: ${result.action_type.name}`);
    }

    this._decay_effects(actor_index);

    return action.success_announcement(actor_state.player.wizard, final_action_value);
  }

  get_winner() {
    if (!this.player_states.length) {
      return null;
    }
    if (this.player_states[0].current_health <= 0) {
      return this.player_states[1].player.wizard;
    }
    if (this.player_states[1].current_health <= 0) {
      return this.player_states[0].player.wizard;
    }
    return null;
  }

  _decay_effects(actor_index) {
    const actor_state = this.player_states[actor_index];
    const defender_state = this.player_states[1 - actor_index];

    this._decrement_effects(actor_state, EffectGroup.BUFFS_AND_DEBUFFS);
    this._decrement_effects(defender_state, EffectGroup.DEFENSES);
  }

  _decrement_effects(state, group) {
    const updated = [];
    state.active_effects.forEach((effect) => {
      if (group.includes(effect)) {
        effect.remaining_turns = Math.max(0, effect.remaining_turns - 1);
      }
      if (effect.remaining_turns > 0) {
        updated.push(effect);
      }
    });
    state.active_effects = updated;
  }

  _apply_heal(state, amount) {
    const new_health = Math.min(state.max_health, state.current_health + amount);
    const healed = new_health - state.current_health;
    state.current_health = new_health;
    return healed;
  }

  _apply_status(state, effect) {
    const existing = state.active_effects.find((active) => active.name === effect.name);
    if (existing) {
      existing.remaining_turns = effect.remaining_turns;
      existing.value = effect.value;
      existing.effect_type = effect.effect_type;
      return;
    }
    state.active_effects.push(effect);
  }

  _calculate_damage(actor, defender, spell, base_damage) {
    let actor_multiplier = actor.player.wizard.damage_multiplier();
    actor.buffs().forEach((buff) => {
      actor_multiplier *= 1 + buff.value;
    });
    actor.debuffs().forEach((debuff) => {
      actor_multiplier *= Math.max(0, 1 - debuff.value);
    });

    let defender_multiplier = defender.player.wizard.damage_reduction();
    defender.buffs().forEach((buff) => {
      defender_multiplier *= 1 + buff.value;
    });
    defender.debuffs().forEach((debuff) => {
      defender_multiplier *= Math.max(0, 1 - debuff.value);
    });

    let damage = base_damage * actor_multiplier * defender_multiplier;

    defender.defenses().forEach((defense) => {
      const defense_element = defense.name;
      if (spell.element.strengths.includes(defense_element)) {
        damage *= 1.05;
      } else if (spell.element.weaknesses.includes(defense_element)) {
        damage *= 0.5;
      } else {
        damage *= 0.9;
      }
    });

    return Math.max(0, Math.round(damage));
  }

  _apply_damage(state, amount) {
    state.current_health = Math.max(0, state.current_health - amount);
  }

  increment_mana() {
    this.player_states.forEach((state) => {
      state.current_mana = Math.max(
        0,
        Math.min(25, state.current_mana + state.player.wizard.mana_per_round())
      );
    });
  }

  action_effect_range(actorIndex, action) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(actorIndex)) {
      throw new Error("actorIndex must be 0 or 1");
    }
    if (!action || typeof action !== "object") {
      throw new Error("action_effect_range requires an action instance");
    }

    const actorState = this.player_states[actorIndex];
    const defenderState = this.player_states[1 - actorIndex];

    if (action.action_type === ActionType.CAST_SPELL && typeof action.spell_type === "function" && action.spell_type() === SpellType.DAMAGE) {
      if (typeof action.range !== "function") {
        return [0, 0];
      }
      const [minVal, maxVal] = action.range();
      const minDamage = this._calculate_damage(actorState, defenderState, action, Number(minVal));
      const maxDamage = this._calculate_damage(actorState, defenderState, action, Number(maxVal));
      return [Math.round(minDamage), Math.round(maxDamage)];
    }

    if (typeof action.range === "function") {
      return action.range();
    }

    return [0, 0];
  }

  action_calculated_range(playerIndex, action) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(playerIndex)) {
      throw new Error("playerIndex must be 0 or 1");
    }
    if (!action || typeof action !== "object") {
      throw new Error("action_calculated_range requires an action instance");
    }
    if (
      action.action_type !== ActionType.CAST_SPELL ||
      (typeof action.spell_type === "function" ? action.spell_type() : action.spell_type) !== SpellType.DAMAGE
    ) {
      if (typeof action.range === "function") {
        return action.range();
      }
      return [0, 0];
    }

    const actorState = this.player_states[playerIndex];
    const defenderState = this.player_states[1 - playerIndex];

    const spellType = typeof action.spell_type === "function" ? action.spell_type() : action.spell_type;
    if (spellType !== SpellType.DAMAGE) {
      if (typeof action.range === "function") {
        return action.range();
      }
      return [0, 0];
    }

    if (typeof action.range !== "function") {
      return [0, 0];
    }

    const [minVal, maxVal] = action.range();
    const minDamage = this._calculate_damage(actorState, defenderState, action, Number(minVal));
    const maxDamage = this._calculate_damage(actorState, defenderState, action, Number(maxVal));
    return [Math.round(minDamage), Math.round(maxDamage)];
  }

  action_is_redundant(actorIndex, action) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(actorIndex)) {
      throw new Error("actorIndex must be 0 or 1");
    }
    if (!action || typeof action !== "object") {
      throw new Error("action_is_redundant requires an action instance");
    }

    if (action.action_type === ActionType.PASS) {
      return false;
    }

    const actorState = this.player_states[actorIndex];
    const activeEffects = actorState.active_effects ?? [];
    const enemyState = this.player_states[1 - actorIndex];
    const enemyEffects = enemyState.active_effects ?? [];

    const actionType = action.action_type;

    if (actionType === ActionType.DEFEND) {
      const effectName = action.element?.name ?? action.element;
      if (!effectName) {
        return false;
      }

      const existing = activeEffects.find(
        (effect) =>
          (effect.effect_type === StatusEffectType.DEFENSE || effect.is_defense) &&
          String(effect.name).toUpperCase() === String(effectName).toUpperCase()
      );

      if (!existing) {
        return false;
      }

      const turns = existing.remaining_turns ?? existing.rounds_remaining ?? 0;
      return turns >= 1;
    }

    if (actionType === ActionType.HEAL) {
      return actorState.current_health == actorState.max_health;
    }

    if (actionType === ActionType.CAST_SPELL) {
      const spellType = action.spell_type;
      if (spellType === SpellType.BUFF) {
        const effectName = action.name;
        if (!effectName) {
          return false;
        }

        const existing = activeEffects.find((effect) => String(effect.name).toUpperCase() === String(effectName).toUpperCase());
        if (!existing) {
          return false;
        }

        const turns = existing.remaining_turns ?? existing.rounds_remaining ?? 0;
        return turns >= 2;
      } else if (spellType === SpellType.DEBUFF) {
        const effectName = action.name;
        if (!effectName) {
          return false;
        }

        const existing = enemyEffects.find((effect) => String(effect.name).toUpperCase() === String(effectName).toUpperCase());
        if (!existing) {
          return false;
        }

        const turns = existing.remaining_turns ?? existing.rounds_remaining ?? 0;
        return turns >= 1;
      }
    }

    return false;
  }

  action_can_kill(actorIndex, action) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(actorIndex)) {
      throw new Error("actorIndex must be 0 or 1");
    }
    if (!action || typeof action !== "object") {
      throw new Error("action_can_kill requires an action instance");
    }

    if (action.action_type === ActionType.PASS) {
      return false;
    }

    if (action.action_type === ActionType.CAST_SPELL && typeof action.spell_type === "function" && action.spell_type() === SpellType.DAMAGE) {
      const [, maxDamage] = this.action_effect_range(actorIndex, action);
      const defenderState = this.player_states[1 - actorIndex];
      return maxDamage >= defenderState.current_health;
    }

    return false;
  }

  player_health_level(playerIndex) {
    const playerState = this.player_states[playerIndex];
    const enemyState = this.player_states[1 - playerIndex];
    const enemyWizard = enemyState.player.wizard;

    const enemyActions = typeof enemyWizard.all_actions === "function" ? enemyWizard.all_actions() : [];

    const canEnemyOneShot = enemyActions.some((action) => {
      if (action.action_type === ActionType.CAST_SPELL && typeof action.spell_type === "function" && action.spell_type() === SpellType.DAMAGE) {
        const rangeFn = typeof action.range === "function" ? action.range : null;
        const [, maxVal = 0] = rangeFn ? rangeFn.call(action) : [0, 0];
        const damage = this._calculate_damage(enemyState, playerState, action, Number(maxVal));
        return damage >= playerState.current_health;
      }
      return false;
    });

    if (canEnemyOneShot) {
      return "Extremely low";
    } else if (playerState.current_health <= playerState.max_health / 3) {
      return "Low";
    } else if (playerState.current_health <= playerState.max_health * (2.0/3.0)) {
      return "Medium";
    }

    return "High";
  }

  compact_available_action_view(playerIndex, action) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(playerIndex)) {
      throw new Error("playerIndex must be 0 or 1");
    }

    var payload = {};

    const accuracy = action.accuracy;
    const manaCost = action.mana_cost;
    const effectiveness = this.action_element_effectiveness(playerIndex, action);
    const isRedundant = this.action_is_redundant(playerIndex, action);
    const canKill = this.action_can_kill(playerIndex, action);

    switch (action.action_type) {
      case ActionType.DEFEND:
        payload = {
          type: action.action_type.name,
          effect: action.compact_effect(),
          mana_cost: manaCost,
          element_effectiveness: effectiveness,
          is_redundant: isRedundant
        };
        break;
      case ActionType.HEAL:
        payload = {
          type: action.action_type.name,
          effect: action.compact_effect(),
          mana_cost: manaCost,
          is_redundant: isRedundant,
        };
        break;
      case ActionType.CAST_SPELL:
        switch (action.spell_type) {
          case SpellType.DAMAGE:
            const [minDamage, maxDamage] = this.action_calculated_range(playerIndex, action)
            payload = {
              type: action.spell_type.name,
              effect: `Deals ${minDamage}-${maxDamage} damage`,
              accuracy,
              mana_cost: manaCost,
              element_effectiveness: effectiveness,
              can_kill: canKill,
            };
            break;
          case SpellType.BUFF:
          case SpellType.DEBUFF:
            payload = {
              type: action.spell_type.name,
              effect: action.compact_effect(),
              accuracy,
              mana_cost: manaCost,
              is_redundant: isRedundant,
            };
            break;
        }
        break;
      case ActionType.PASS:
        payload = {
          type: ActionType.PASS.name,
          effect: action.compact_effect(),
          mana_cost: manaCost,
        };
        break;
    }

    return JSON.stringify(payload);
  }

  affordable_actions(playerIndex) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(playerIndex)) {
      throw new Error("playerIndex must be 0 or 1");
    }

    const playerState = this.player_states[playerIndex];
    const wizard = playerState.player.wizard;

    if (!wizard || typeof wizard.all_actions !== "function") {
      return [];
    }

    return wizard
      .all_actions()
      .filter((action) => {
        const manaCost = typeof action.mana_cost === "function" ? action.mana_cost() : action.mana_cost ?? 0;
        return manaCost <= playerState.current_mana;
      });
  }

  player_unaffordable_actions(playerIndex) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(playerIndex)) {
      throw new Error("playerIndex must be 0 or 1");
    }

    const playerState = this.player_states[playerIndex];
    const wizard = playerState.player?.wizard;

    if (!wizard || typeof wizard.all_actions !== "function") {
      return [];
    }

    const currentMana = Number(playerState.current_mana ?? 0) || 0;

    return wizard
      .all_actions()
      .filter((action) => {
        const manaCostRaw = typeof action.mana_cost === "function" ? action.mana_cost() : action.mana_cost;
        const manaCost = Number(manaCostRaw ?? 0) || 0;
        return manaCost > currentMana;
      });
  }

  compact_battle_context(playerIndex) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(playerIndex)) {
      throw new Error("playerIndex must be 0 or 1");
    }

    const actorState = this.player_states[playerIndex];
    const actorWizard = actorState.player.wizard;

    const actorInfo = {
      health_level: this.player_health_level(playerIndex),
      mana_level: this.player_mana_level(playerIndex),
      offensive_level: this.player_offensive_level(playerIndex),
      defensive_level: this.player_defensive_level(playerIndex),
      available_actions: [],
      unavailable_actions: [],
    };

    const availableActions = this.affordable_actions(playerIndex) ?? [];
    actorInfo.available_actions = availableActions.map((action, _) => this.compact_available_action_view(playerIndex, action));

    const unavailableActions = this.player_unaffordable_actions(playerIndex) ?? [];
    actorInfo.unavailable_actions = unavailableActions.map((action, _) => this.compact_available_action_view(playerIndex, action));

    const enemyIndex = 1 - playerIndex;
    const enemyInfo = {
      health_level: this.player_health_level(enemyIndex),
      mana_level: this.player_mana_level(enemyIndex),
      offensive_level: this.player_offensive_level(enemyIndex),
      defensive_level: this.player_defensive_level(enemyIndex),
    };

    return { actor_info: actorInfo, enemy_info: enemyInfo };
  }

  player_mana_level(playerIndex) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(playerIndex)) {
      throw new Error("playerIndex must be 0 or 1");
    }

    const playerState = this.player_states[playerIndex];
    const mana = playerState.current_mana ?? 0;

    if (mana > 16) {
      return "high";
    }
    if (mana > 8) {
      return "medium";
    }
    return "low";
  }

  player_offensive_level(playerIndex) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(playerIndex)) {
      throw new Error("playerIndex must be 0 or 1");
    }

    const playerState = this.player_states[playerIndex];
    const activeEffects = playerState.active_effects ?? [];

    const netBuffs = activeEffects.reduce((total, effect) => {
      if (effect.effect_type === StatusEffectType.BUFF || effect.is_buff) {
        return total + (Number(effect.value ?? 0) || 0);
      }
      if (effect.effect_type === StatusEffectType.DEBUFF || effect.is_debuff) {
        return total - (Number(effect.value ?? 0) || 0);
      }
      return total;
    }, 0);

    if (netBuffs > 0) {
      return "high";
    }
    if (netBuffs === 0) {
      return "medium";
    }
    return "low";
  }

  player_defensive_level(playerIndex) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(playerIndex)) {
      throw new Error("playerIndex must be 0 or 1");
    }

    const playerState = this.player_states[playerIndex];
    const enemyState = this.player_states[1 - playerIndex];
    const activeEffects = playerState.active_effects ?? [];

    const netBuffs = activeEffects.reduce((total, effect) => {
      if (effect.effect_type === StatusEffectType.BUFF || effect.is_buff) {
        return total + (Number(effect.value ?? 0) || 0);
      }
      if (effect.effect_type === StatusEffectType.DEBUFF || effect.is_debuff) {
        return total - (Number(effect.value ?? 0) || 0);
      }
      return total;
    }, 0);

    const enemyElements = [enemyState.player.wizard.primary_element?.name, enemyState.player.wizard.secondary_element?.name]
      .filter(Boolean)
      .map((elementName) => Element.fromName(elementName));

    const defenses = activeEffects.filter((effect) => effect.effect_type === StatusEffectType.DEFENSE || effect.is_defense);

    const shieldEffectiveness = defenses.reduce((sum, effect) => {
      const shieldElement = Element.fromName(effect.name);
      if (!shieldElement) {
        return sum;
      }

      const elementScore = enemyElements.reduce((elementScore, enemyElement) => {
        if (shieldElement.strengths.includes(enemyElement.name)) {
          return elementScore + 3;
        }
        if (shieldElement.weaknesses.includes(enemyElement.name)) {
          return elementScore - 1;
        }
        return elementScore + 1;
      }, 0);
      return sum + elementScore;
    }, 0);

    if (netBuffs > 0 && shieldEffectiveness > 0) {
      return "Extremely high";
    }

    if ((shieldEffectiveness > 0 && netBuffs === 0) || (shieldEffectiveness === 0 && netBuffs > 0)) {
      return "High";
    }

    if ((shieldEffectiveness < 0 && netBuffs === 0) || (shieldEffectiveness === 0 && netBuffs < 0)) {
      return "Low";
    }

    if (shieldEffectiveness < 0 && netBuffs < 0) {
      return "Extremely low";
    }

    return "Medium";
  }

  action_element_effectiveness(actorIndex, action) {
    if (!this.player_states.length) {
      throw new Error("GameState is uninitialized");
    }
    if (![0, 1].includes(actorIndex)) {
      throw new Error("actorIndex must be 0 or 1");
    }
    if (!action || typeof action !== "object") {
      throw new Error("action_element_effectiveness requires an action instance");
    }

    if (action.action_type === ActionType.PASS) {
      return "medium";
    }

    const actorState = this.player_states[actorIndex];
    const defenderState = this.player_states[1 - actorIndex];
    const defenderWizard = defenderState.player.wizard;

    const getElement = (elementLike) => {
      if (!elementLike) {
        return null;
      }
      if (typeof elementLike.name === "string") {
        return Element.fromName(elementLike.name);
      }
      if (typeof elementLike === "string") {
        return Element.fromName(elementLike);
      }
      return null;
    };

    const defenseEffects = defenderState.active_effects?.filter(
      (effect) => (effect.effect_type ?? effect.type) === StatusEffectType.DEFENSE || effect.is_defense
    ) ?? [];
    const defenseElements = defenseEffects
      .map((effect) => getElement(effect.name ?? effect.element))
      .filter(Boolean);

    if (typeof action.action_type !== "undefined") {
      const actionType = action.action_type;

      if (actionType === ActionType.CAST_SPELL) {
        const spellType = action.spell_type;
        if (spellType === SpellType.DAMAGE) {
          const actionElement = getElement(action.element);

          if (!actionElement) {
            return "medium";
          }

          let effectivenessSum = 0;
          defenseElements.forEach((defenseElement) => {
            if (actionElement.strengths.includes(defenseElement.name)) {
              effectivenessSum += 1;
            } else if (actionElement.weaknesses.includes(defenseElement.name)) {
              effectivenessSum -= 2;
            }
          });

          if (effectivenessSum > 0) {
            return "high";
          }
          if (effectivenessSum === 0) {
            return "medium";
          }
          return "low";
        }
      }

      if (actionType === ActionType.DEFEND) {
        const actionElement = getElement(action.element);
        if (!actionElement) {
          return "medium";
        }

        const enemyWizard = defenderWizard;
        const enemyActions = typeof enemyWizard.all_actions === "function" ? enemyWizard.all_actions() : [];
        let effectivenessSum = 0;

        enemyActions.forEach((enemyAction) => {
          if (
            enemyAction.action_type === ActionType.CAST_SPELL &&
            enemyAction.spell_type === SpellType.DAMAGE
          ) {
            const enemyElement = getElement(enemyAction.element);
            if (!enemyElement) {
              return;
            }

            if (actionElement.strengths.includes(enemyElement.name)) {
              effectivenessSum += 2;
            } else if (actionElement.weaknesses.includes(enemyElement.name)) {
              effectivenessSum -= 1;
            }
          }
        });

        if (effectivenessSum > 0) {
          return "high";
        }
        if (effectivenessSum === 0) {
          return "medium";
        }
        return "low";
      }
    }

    return "medium";
  }

  toString() {
    if (this.player_states.length < 2) {
      return "GameState: <uninitialized>";
    }

    const lines = this.player_states.map((state, idx) => `Player ${idx + 1}: ${state.toString()}`);
    lines.push("Actions:");
    if (!this.action_log.length) {
      lines.push("  (none)");
    } else {
      this.action_log.forEach((record, idx) => {
        const actor_label = record.actor_id === 0 ? "Player 1" : "Player 2";
        lines.push(`  ${idx + 1}. ${actor_label} -> ${record.type.name} (${record.target.name}) | ${record.result}`);
      });
    }

    return lines.join("\n");
  }

  battleSnapshot(actingWizardIndex) {
    if (typeof actingWizardIndex !== "number" || ![0, 1].includes(actingWizardIndex)) {
      throw new Error("battleSnapshot requires actingWizardIndex 0 or 1");
    }

    if (this.player_states.length < 2) {
      throw new Error("GameState is not initialized");
    }

    const actingState = this.player_states[actingWizardIndex];
    const enemyState = this.player_states[1 - actingWizardIndex];

    const formatActions = (actions, use_numbers = false) => {
      if (!actions?.length) {
        return "  (none)";
      }
      return actions
        .map((action, idx) => {
          const overview = action.overview();
          return `${use_numbers ? idx + 1 : ""}- ${Array.isArray(overview) ? overview.join(" ") : overview}`;
        })
        .join("\n");
    };

    const actingActions = formatActions(
      actingState.player.wizard.affordable_actions(actingState.current_mana), true
    );
    const enemyActions = formatActions(
      enemyState.player.wizard.affordable_actions(enemyState.current_mana)
    );

    const actingEffects = actingState.active_effects?.length
      ? actingState.active_effects.map((effect) => effect.toString()).join(", ")
      : "(none)";
    const enemyEffects = enemyState.active_effects?.length
      ? enemyState.active_effects.map((effect) => effect.toString()).join(", ")
      : "(none)";

    return `Your State:
- Health: ${actingState.current_health}/${actingState.max_health}
- Mana: ${actingState.current_mana}
- Active Effects:
    ${actingEffects}

Enemy State:
- Health: ${enemyState.current_health}/${enemyState.max_health}
- Mana: ${enemyState.current_mana}
- Active Effects:
    ${enemyEffects}

Enemy Available Actions:
${enemyActions || "  (none)"}

Choose ONE of the following actions to take:
${actingActions || "  (none)"}

Make sure to follow your combat style: ${actingState.player.wizard.combat_style}`;
  }
}

const game_state = new GameState();

export { GameState };
export default game_state;
