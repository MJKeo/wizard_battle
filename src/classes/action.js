import ActionType from "../enums/actionType";

class Action {
  constructor(action_type, strength, accuracy, variance) {
    if (new.target === Action) {
      throw new Error("Action is abstract and cannot be instantiated directly");
    }
    this.action_type = action_type;
    this.strength = strength;
    this.accuracy = accuracy;
    this.variance = variance;
  }

  succeeds_accuracy(randomFn = Math.random) {
    return randomFn() <= this.accuracy;
  }

  perform_action(randomFn = Math.random) {
    if (!this.succeeds_accuracy(randomFn)) {
      return { succeeded: false };
    }
    return this.perform_action_subclass(randomFn);
  }

  perform_action_subclass() {
    throw new Error("perform_action_subclass must be implemented by subclasses");
  }

  range() {
    throw new Error("range must be implemented by subclasses");
  }

  compact_effect() {
    throw new Error("compact effect must be implemented by subclasses");
  }

  mana_cost() {
    throw new Error("mana_cost must be implemented by subclasses");
  }

  overview() {
    throw new Error("overview must be implemented by subclasses");
  }

  failure_announcement() {
    throw new Error("failure_announcement must be implemented by subclasses");
  }

  success_announcement() {
    throw new Error("success_announcement must be implemented by subclasses");
  }

  action_target() {
    throw new Error("action_target must be implemented by subclasses");
  }

  display_card() {
    throw new Error("display_card must be implemented by subclasses");
  }
}

export default Action;
