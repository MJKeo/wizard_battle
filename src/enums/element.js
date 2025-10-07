class Element {
  constructor(name, displayName, description, strengths, weaknesses, accuracy) {
    this.name = name;
    this._display_name = displayName;
    this._description = description;
    this._strengths = strengths;
    this._weaknesses = weaknesses;
    this._accuracy = accuracy;
  }

  static #values = {
    FIRE: new Element(
      "FIRE",
      "Fire",
      "Represents destruction, passion, and energy.",
      ["ICE", "DEATH"],
      ["STORM", "MYTH"],
      0.75
    ),
    ICE: new Element(
      "ICE",
      "Ice",
      "Represents control, patience, and slow movements.",
      ["STORM", "MYTH"],
      ["FIRE", "LIFE"],
      0.8
    ),
    STORM: new Element(
      "STORM",
      "Storm",
      "Represents chaos, unpredictability, and raw power.",
      ["FIRE", "LIFE"],
      ["ICE", "BALANCE"],
      0.7
    ),
    LIFE: new Element(
      "LIFE",
      "Life",
      "Represents healing, vitality, and growth.",
      ["DEATH", "MYTH"],
      ["STORM", "ICE"],
      0.9
    ),
    DEATH: new Element(
      "DEATH",
      "Death",
      "Represents decay, sacrifice, and inevitability.",
      ["LIFE", "BALANCE"],
      ["FIRE", "MYTH"],
      0.85
    ),
    MYTH: new Element(
      "MYTH",
      "Myth",
      "Represents illusions, trickery, and ancient power.",
      ["FIRE", "DEATH"],
      ["ICE", "LIFE"],
      0.8
    ),
    BALANCE: new Element(
      "BALANCE",
      "Balance",
      "Represents harmony, control, and versatility.",
      ["STORM", "MYTH"],
      ["DEATH", "LIFE"],
      0.85
    ),
  };

  static get FIRE() {
    return Element.#values.FIRE;
  }

  static get ICE() {
    return Element.#values.ICE;
  }

  static get STORM() {
    return Element.#values.STORM;
  }

  static get LIFE() {
    return Element.#values.LIFE;
  }

  static get DEATH() {
    return Element.#values.DEATH;
  }

  static get MYTH() {
    return Element.#values.MYTH;
  }

  static get BALANCE() {
    return Element.#values.BALANCE;
  }

  static values() {
    return Object.values(Element.#values);
  }

  static fromName(name) {
    if (!name) {
      throw new Error("Element.fromName requires a name");
    }
    const key = String(name).toUpperCase();
    const result = Element.#values[key];
    if (!result) {
      throw new Error(`Unknown Element: ${name}`);
    }
    return result;
  }

  get display_name() {
    return this._display_name;
  }

  get description() {
    return this._description;
  }

  get strengths() {
    return this._strengths.slice();
  }

  get weaknesses() {
    return this._weaknesses.slice();
  }

  get accuracy() {
    return this._accuracy;
  }
}

export default Element;
