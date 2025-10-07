class SpellType {
  constructor(name, variance) {
    this.name = name;
    this.variance = variance;
  }

  static #values = {
    DAMAGE: new SpellType("DAMAGE", 0.1),
    BUFF: new SpellType("BUFF", 0.05),
    DEBUFF: new SpellType("DEBUFF", 0.05),
  };

  static get DAMAGE() {
    return SpellType.#values.DAMAGE;
  }

  static get BUFF() {
    return SpellType.#values.BUFF;
  }

  static get DEBUFF() {
    return SpellType.#values.DEBUFF;
  }

  static values() {
    return Object.values(SpellType.#values);
  }

  static fromName(name) {
    if (!name) {
      throw new Error("SpellType.fromName requires a name");
    }
    const key = String(name).toUpperCase();
    const result = SpellType.#values[key];
    if (!result) {
      throw new Error(`Unknown SpellType: ${name}`);
    }
    return result;
  }
}

export default SpellType;
