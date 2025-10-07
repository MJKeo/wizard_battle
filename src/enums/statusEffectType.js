class StatusEffectType {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }

  static #values = {
    DEFENSE: new StatusEffectType("DEFENSE", "defense"),
    BUFF: new StatusEffectType("BUFF", "buff"),
    DEBUFF: new StatusEffectType("DEBUFF", "debuff"),
  };

  static get DEFENSE() {
    return StatusEffectType.#values.DEFENSE;
  }

  static get BUFF() {
    return StatusEffectType.#values.BUFF;
  }

  static get DEBUFF() {
    return StatusEffectType.#values.DEBUFF;
  }

  static values() {
    return Object.values(StatusEffectType.#values);
  }

  static fromName(name) {
    if (!name) {
      throw new Error("StatusEffectType.fromName requires a name");
    }
    const key = String(name).toUpperCase();
    const result = StatusEffectType.#values[key];
    if (!result) {
      throw new Error(`Unknown StatusEffectType: ${name}`);
    }
    return result;
  }

  toString() {
    return this.value;
  }
}

export default StatusEffectType;
