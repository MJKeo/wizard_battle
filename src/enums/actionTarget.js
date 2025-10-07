class ActionTarget {
  constructor(name) {
    this.name = name;
  }

  static #values = {
    SELF: new ActionTarget("SELF"),
    ENEMY: new ActionTarget("ENEMY"),
  };

  static get SELF() {
    return ActionTarget.#values.SELF;
  }

  static get ENEMY() {
    return ActionTarget.#values.ENEMY;
  }

  static values() {
    return Object.values(ActionTarget.#values);
  }

  static fromName(name) {
    if (!name) {
      throw new Error("ActionTarget.fromName requires a name");
    }
    const key = String(name).toUpperCase();
    const result = ActionTarget.#values[key];
    if (!result) {
      throw new Error(`Unknown ActionTarget: ${name}`);
    }
    return result;
  }
}

export default ActionTarget;
