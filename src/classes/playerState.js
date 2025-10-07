import StatusEffect from "./statusEffect";

class PlayerState {
  constructor(player, max_health, current_health, current_mana, active_effects = []) {
    this.player = player;
    this.max_health = max_health;
    this.current_health = current_health;
    this.current_mana = current_mana;
    this.active_effects = active_effects;
  }

  buffs() {
    return this.active_effects.filter((effect) => effect.is_buff);
  }

  debuffs() {
    return this.active_effects.filter((effect) => effect.is_debuff);
  }

  defenses() {
    return this.active_effects.filter((effect) => effect.is_defense);
  }

  toString() {
    return `${this.player.wizard.name}: HP ${this.current_health}/${this.max_health}, Mana ${this.current_mana}, Effects: ${this.#effects_summary()}`;
  }

  #effects_summary() {
    if (!this.active_effects.length) {
      return "(none)";
    }
    return this.active_effects.map((effect) => effect.toString()).join(", ");
  }
}

export default PlayerState;
