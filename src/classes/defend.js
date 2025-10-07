import Action from "./action";
import ActionType from "../enums/actionType";
import ActionTarget from "../enums/actionTarget";

class Defend extends Action {
  static ACCURACY = 1.0;
  static VARIANCE = 0.0;

  constructor(element) {
    super(ActionType.DEFEND, 1.0, Defend.ACCURACY, Defend.VARIANCE);
    this.element = element;
  }

  toString() {
    return [
      "Defend Action:",
      `  action_type: ${ActionType.DEFEND.name}`,
      `  element: ${this.element.name}`,
      `  strength: ${this.strength.toFixed(2)}`,
      `  accuracy: ${this.accuracy.toFixed(2)}`,
      `  mana_cost: ${this.mana_cost()}`,
    ].join("\n");
  }

  perform_action_subclass() {
    return {
      succeeded: true,
      value: this.element,
      action_type: ActionType.DEFEND,
      target: ActionTarget.SELF,
    };
  }

  range() {
    return null;
  }

  mana_cost() {
    return 2;
  }

  overview() {
    return [
      "Action Type: 'DEFEND'",
      `Element: ${this.element.name}`,
      `Accuracy: ${100 * this.accuracy}%`,
      `Target: ${ActionTarget.SELF.name}`,
      `Mana Cost: ${this.mana_cost()}`,
      `Description: Puts up a ${this.element.name} shield to greatly reduce incoming damage`,
      `Elements strong against: ${this.element.strengths.join(", ")}`,
      `Elements weak against: ${this.element.weaknesses.join(", ")}`,
    ].join(", ");
  }

  failure_announcement(wizard) {
    return `${wizard.name} failed a defense? How?!?!?`;
  }

  success_announcement(wizard) {
    return `${wizard.name} put up a ${this.element.name} shield!`;
  }

  action_target() {
    return ActionTarget.SELF;
  }

  compact_effect() {
    return `Reduces incoming damage`;
  }

  display_card() {
    const strengths = this.element.strengths.join(", ");
    const weaknesses = this.element.weaknesses.join(", ");
    const description = `Raises a ${this.element.display_name} shield (strong against ${strengths}, weak against ${weaknesses})`;
    return {
      type: "DEFENSE",
      range: "0-50%",
      element: this.element.name,
      name: `${this.element.display_name} Defense`,
      description,
      accuracy: this.accuracy,
      mana_cost: this.mana_cost(),
    };
  }
}

export default Defend;
