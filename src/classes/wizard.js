import Heal from "./heal";
import Defend from "./defend";
import Pass from "./pass";
import Spell from "./spell";
import Element from "../enums/element";
import SpellType from "../enums/spellType";
import vary from "../util/vary";

class Wizard {
  constructor(
    name,
    primary_element,
    secondary_element,
    attack,
    defense,
    health,
    healing,
    arcane,
    spells,
    combat_style
  ) {
    this.name = name;
    this.primary_element = primary_element;
    this.secondary_element = secondary_element;
    this.attack = attack;
    this.defense = defense;
    this.health = health;
    this.healing = healing;
    this.arcane = arcane;
    this.spells = spells;
    this.combat_style = combat_style;
  }

  toString() {
    const header = [
      `Name: ${this.name}`,
      `Primary element=${this.primary_element}`,
      `Secondary element=${this.secondary_element}`,
      `attack=${this.attack}`,
      `defense=${this.defense}`,
      `health=${this.health}`,
      `healing=${this.healing}`,
      `arcane=${this.arcane}`,
      `combat style=${this.combat_style}`,
      `max hp=${this.max_hp()}`,
      `damage mult=${this.damage_multiplier()}`,
      `damage red=${this.damage_reduction()}`,
      `starting mana=${this.starting_mana()}`,
      `mpr=${this.mana_per_round()}`,
    ].join("\n ");

    const actions = this.all_actions().map((action, idx) => `Action ${idx + 1}: ${action.overview()}`);
    const actions_block = actions.join("\n ");

    return `${header} Available actions:\n ${actions_block}`;
  }

  max_hp(randomFn = Math.random) {
    const base = 500 * 2 ** (this.health ** 2);
    const varied = vary(base, 0.1, randomFn);
    return Math.max(1, Math.round(varied));
  }

  damage_multiplier() {
    return 1.25 ** (this.attack ** 2);
  }

  damage_reduction() {
    return 1.1 * (8 / 11) ** (this.defense ** 1.8);
  }

  starting_mana(randomFn = Math.random) {
    const base = 10 * 2 ** (this.arcane ** 1.3);
    const varied = vary(base, 0.1, randomFn);
    return Math.max(0, Math.round(varied));
  }

  mana_per_round() {
    const base = 2 * 2.5 ** (this.arcane ** 1.15);
    return Math.round(base);
  }

  all_actions() {
    const spell_priority = {
      [SpellType.DAMAGE.name]: 0,
      [SpellType.BUFF.name]: 1,
      [SpellType.DEBUFF.name]: 2,
    };

    const sorted_spells = [...this.spells].sort((a, b) => {
      const left = spell_priority[a.spell_type.name] ?? Number.POSITIVE_INFINITY;
      const right = spell_priority[b.spell_type.name] ?? Number.POSITIVE_INFINITY;
      if (left !== right) {
        return left - right;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

    const actions = [];
    actions.push(...sorted_spells);
    actions.push(new Defend(this.primary_element));
    actions.push(new Defend(this.secondary_element));
    actions.push(new Heal(this));
    actions.push(new Pass());
    return actions;
  }

  affordable_actions(mana_cap) {
    return this.all_actions().filter((action) => action.mana_cost() <= mana_cap);
  }

  static build_from_json(data) {
    const required = [
      "name",
      "primary_element",
      "secondary_element",
      "attack",
      "defense",
      "health",
      "healing",
      "arcane",
      "combat_style",
      "spells",
    ];

    const missing = required.filter((key) => !(key in data));
    if (missing.length > 0) {
      throw new Error(`Missing keys for Wizard: ${missing.join(", ")}`);
    }

    const spells_payload = data.spells;
    if (!Array.isArray(spells_payload)) {
      throw new Error("Wizard 'spells' must be a list");
    }

    const spells = spells_payload.map(Spell.build_from_json);

    return new Wizard(
      String(data.name),
      Element.fromName(data.primary_element),
      Element.fromName(data.secondary_element),
      Number(data.attack),
      Number(data.defense),
      Number(data.health),
      Number(data.healing),
      Number(data.arcane),
      spells,
      String(data.combat_style)
    );
  }
}

export default Wizard;
