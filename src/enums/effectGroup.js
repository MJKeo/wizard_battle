import StatusEffectType from "./statusEffectType";

class EffectGroup {
  constructor(name) {
    this.name = name;
  }

  includes(effect) {
    if (!effect) {
      return false;
    }
    switch (this) {
      case EffectGroup.BUFFS_AND_DEBUFFS:
        return effect.effect_type === StatusEffectType.BUFF || effect.effect_type === StatusEffectType.DEBUFF;
      case EffectGroup.DEFENSES:
        return effect.effect_type === StatusEffectType.DEFENSE;
      default:
        return false;
    }
  }

  static #values = {
    BUFFS_AND_DEBUFFS: new EffectGroup("BUFFS_AND_DEBUFFS"),
    DEFENSES: new EffectGroup("DEFENSES"),
  };

  static get BUFFS_AND_DEBUFFS() {
    return EffectGroup.#values.BUFFS_AND_DEBUFFS;
  }

  static get DEFENSES() {
    return EffectGroup.#values.DEFENSES;
  }

  static values() {
    return Object.values(EffectGroup.#values);
  }

  static fromName(name) {
    if (!name) {
      throw new Error("EffectGroup.fromName requires a name");
    }
    const key = String(name).toUpperCase();
    const result = EffectGroup.#values[key];
    if (!result) {
      throw new Error(`Unknown EffectGroup: ${name}`);
    }
    return result;
  }
}

export default EffectGroup;
