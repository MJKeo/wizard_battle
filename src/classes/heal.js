import Action from "./action";
import ActionType from "../enums/actionType";
import ActionTarget from "../enums/actionTarget";
import vary from "../util/vary";

class Heal extends Action {
  static ACCURACY = 0.95;
  static VARIANCE = 0.1;

  constructor(wizard) {
    super(ActionType.HEAL, wizard.healing, Heal.ACCURACY, Heal.VARIANCE);
    this.wizard = wizard;
  }

  toString() {
    return [
      "Heal Action:",
      `  action_type: ${ActionType.HEAL.name}`,
      `  strength: ${this.strength.toFixed(2)}`,
      `  accuracy: ${this.accuracy.toFixed(2)}`,
      `  range: ${JSON.stringify(this.range())}`,
      `  mana_cost: ${this.mana_cost()}`,
    ].join("\n");
  }

  #healing_base() {
    return 150 * (5 / 3) ** (this.strength ** 1.8);
  }

  compact_effect() {
    const [minVal, maxVal] = this.range();
    return `Restore ${minVal}-${maxVal} health`;
  }

  perform_action_subclass(randomFn = Math.random) {
    const healingBase = this.#healing_base();
    const healingAmount = Math.max(0, Math.round(vary(healingBase, this.variance, randomFn)));

    return {
      succeeded: true,
      value: healingAmount,
      action_type: ActionType.HEAL,
      target: ActionTarget.SELF,
    };
  }

  range() {
    const healingBase = this.#healing_base();
    const minVal = Math.round(healingBase * (1 - this.variance));
    const maxVal = Math.round(healingBase * (1 + this.variance));
    return [minVal, maxVal];
  }

  mana_cost() {
    return 5;
  }

  overview() {
    return [
      "Action Type: 'HEAL'",
      `Accuracy: ${100 * this.accuracy}%`,
      `Target: ${ActionTarget.SELF.name}`,
      `Mana Cost: ${this.mana_cost()}`,
      `Description: Restores ${this.range()[0]} to ${this.range()[1]} hp`,
    ].join(", ");
  }

  failure_announcement(wizard) {
    return `${wizard.name} casts heal... but it failed!`;
  }

  success_announcement(wizard, value) {
    return `${wizard.name}  casts heal. ${Math.trunc(value)} health was restored!`;
  }

  action_target() {
    return ActionTarget.SELF;
  }

  display_card() {
    const [minVal, maxVal] = this.range();
    return {
      type: "HEAL",
      range: this.range(),
      element: null,
      name: "Heal",
      description: `Restores ${minVal}-${maxVal} health.`,
      accuracy: this.accuracy,
      mana_cost: this.mana_cost(),
    };
  }
}

export default Heal;
