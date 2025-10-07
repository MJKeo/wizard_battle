import Action from "./action";
import ActionType from "../enums/actionType";
import ActionTarget from "../enums/actionTarget";
import SpellType from "../enums/spellType";
import vary from "../util/vary";
import Element from "../enums/element";

class Spell extends Action {
  constructor(name, spell_type, description, element, strength) {
    super(ActionType.CAST_SPELL, strength, element.accuracy, spell_type.variance);
    this.name = name;
    this.spell_type = spell_type;
    this.description = description;
    this.element = element;
  }

  toString() {
    return [
      "Spell Action:",
      `  action_type: ${ActionType.CAST_SPELL.name}`,
      `  name: ${this.name}`,
      `  spell_type: ${this.spell_type.name}`,
      `  element: ${this.element.name}`,
      `  strength: ${this.strength.toFixed(2)}`,
      `  accuracy: ${this.accuracy.toFixed(2)}`,
      `  variance: ${this.variance.toFixed(3)}`,
      `  range: ${JSON.stringify(this.range())}`,
      `  mana_cost: ${this.mana_cost()}`,
      `  description: ${this.description}`,
    ].join("\n");
  }

  #base_spell_value() {
    switch (this.spell_type) {
      case SpellType.DAMAGE:
        return 100 * 2 ** (this.strength ** 2);
      case SpellType.BUFF:
        return 0.1 * (0.25 / 0.1) ** (this.strength ** 1.8);
      case SpellType.DEBUFF:
        return 0.1 * (0.25 / 0.1) ** (this.strength ** 1.8);
      default:
        throw new Error(`Unhandled spell type: ${this.spell_type}`);
    }
  }

  #varied_spell_value(randomFn = Math.random) {
    const baseValue = this.#base_spell_value();
    const varied = vary(baseValue, this.variance, randomFn);
    return this.#round_spell_value(varied);
  }

  #round_spell_value(value) {
    switch (this.spell_type) {
      case SpellType.DAMAGE:
        return Math.round(value);
      case SpellType.BUFF:
      case SpellType.DEBUFF:
        return Number(value.toFixed(3));
      default:
        throw new Error(`Unhandled spell type: ${this.spell_type}`);
    }
  }

  action_target() {
    switch (this.spell_type) {
      case SpellType.DAMAGE:
        return ActionTarget.ENEMY;
      case SpellType.BUFF:
        return ActionTarget.SELF;
      case SpellType.DEBUFF:
        return ActionTarget.ENEMY;
      default:
        throw new Error(`Unhandled spell type: ${this.spell_type}`);
    }
  }

  #spell_effect() {
    const [minVal, maxVal] = this.range();
    switch (this.spell_type) {
      case SpellType.DAMAGE:
        return `Deals ${minVal}-${maxVal} damage`;
      case SpellType.BUFF:
        return `Increases your attack and defense by ${minVal}-${maxVal}% for 3 rounds`;
      case SpellType.DEBUFF:
        return `Reduces enemy attack and defense by ${minVal}-${maxVal}% for 3 rounds`;
      default:
        throw new Error(`Unhandled spell type: ${this.spell_type}`);
    }
  }

  compact_effect() {
    const [minVal, maxVal] = this.range();
    switch (this.spell_type) {
      case SpellType.DAMAGE:
        return `Deals ${minVal}-${maxVal} damage`;
      case SpellType.BUFF:
        return `Increase attack and defense by ${(100 * minVal).toFixed(1)}-${(100 * maxVal).toFixed(1)}%`;
      case SpellType.DEBUFF:
        return `Reduces enemy attack and defense by ${(100 * minVal).toFixed(1)}-${(100 * maxVal).toFixed(1)}%`;
      default:
        throw new Error(`Unhandled spell type: ${this.spell_type}`);
    }
  }

  perform_action_subclass(randomFn = Math.random) {
    const spell_value = this.#varied_spell_value(randomFn);
    const target = this.action_target();

    return {
      succeeded: true,
      value: spell_value,
      action_type: ActionType.CAST_SPELL,
      spell_type: this.spell_type,
      target,
    };
  }

  range() {
    const base = this.#base_spell_value();
    const minVal = this.#round_spell_value(base * (1 - this.variance));
    const maxVal = this.#round_spell_value(base * (1 + this.variance));
    return [minVal, maxVal];
  }

  mana_cost() {
    switch (this.spell_type) {
      case SpellType.DAMAGE:
        return Math.round(3 * (10 / 3) ** (this.strength ** 1.15));
      case SpellType.BUFF:
      case SpellType.DEBUFF:
        return Math.round(1 * (3.4) ** (this.strength ** 1.15));
      default:
        throw new Error(`Unhandled spell type: ${this.spell_type}`);
    }
  }

  overview() {
    return [
      "Action Type: 'CAST_SPELL'",
      `Spell Type: ${this.spell_type.name}`,
      `Element: ${this.element.name}`,
      `Accuracy: ${100 * this.accuracy}%`,
      `Target: ${this.action_target().name}`,
      `Mana Cost: ${this.mana_cost()}`,
      `Description: ${this.#spell_effect()}`,
      `Elements strong against: ${this.element.strengths.join(", ")}`,
      `Elements weak against: ${this.element.weaknesses.join(", ")}`,
    ].join(", ");
  }

  failure_announcement(wizard) {
    return `${wizard.name} casts ${this.name}... but it failed!`;
  }

  success_announcement(wizard, value) {
    switch (this.spell_type) {
      case SpellType.DAMAGE:
        return `${wizard.name} casts ${this.name} dealing ${Math.round(value)} damage!`;
      case SpellType.BUFF:
        return `${wizard.name} casts ${this.name}. Their attack and defense increase by ${value}%!`;
      case SpellType.DEBUFF:
        return `${wizard.name} casts ${this.name}. Their opponent's attack and defense decrease by ${value}%!`;
      default:
        throw new Error(`Unhandled spell type: ${this.spell_type}`);
    }
  }

  display_range() {
    const [minVal, maxVal] = this.range();
    switch (this.spell_type) {
      case SpellType.DAMAGE:
        return `${minVal}-${maxVal}`;
      case SpellType.BUFF:
      case SpellType.DEBUFF:
        return `${(minVal * 100).toFixed(1)}-${(maxVal * 100).toFixed(1)}%`;
    }
  }

  display_card() {
    return {
      type: this.spell_type.name,
      element: this.element.name,
      range: this.display_range(),
      name: this.name,
      description: this.description,
      accuracy: this.accuracy,
      mana_cost: this.mana_cost(),
    };
  }

  static build_from_json(data) {
    const required = ["name", "spell_type", "description", "element", "strength"];
    const missing = required.filter((key) => !(key in data));
    if (missing.length > 0) {
      throw new Error(`Missing keys for Spell: ${missing.join(", ")}`);
    }

    return new Spell(
      String(data.name),
      SpellType.fromName(data.spell_type),
      String(data.description),
      typeof data.element === "string" ? Element.fromName(data.element) : data.element,
      Number(data.strength)
    );
  }
}

export default Spell;
