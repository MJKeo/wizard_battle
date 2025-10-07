class ActionType {
  constructor(name) {
    this.name = name;
  }

  static #values = {
    CAST_SPELL: new ActionType("CAST_SPELL"),
    HEAL: new ActionType("HEAL"),
    DEFEND: new ActionType("DEFEND"),
    PASS: new ActionType("PASS"),
  };

  static get CAST_SPELL() {
    return ActionType.#values.CAST_SPELL;
  }

  static get HEAL() {
    return ActionType.#values.HEAL;
  }

  static get DEFEND() {
    return ActionType.#values.DEFEND;
  }

  static get PASS() {
    return ActionType.#values.PASS;
  }

  static values() {
    return Object.values(ActionType.#values);
  }

  static fromName(name) {
    if (!name) {
      throw new Error("ActionType.fromName requires a name");
    }
    const key = String(name).toUpperCase();
    const result = ActionType.#values[key];
    if (!result) {
      throw new Error(`Unknown ActionType: ${name}`);
    }
    return result;
  }
}

export default ActionType;
