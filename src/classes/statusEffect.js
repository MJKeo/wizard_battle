import StatusEffectType from "../enums/statusEffectType";

class StatusEffect {
  constructor(name, effect_type, value, remaining_turns) {
    this.name = name;
    this.effect_type = effect_type;
    this.value = value;
    this.remaining_turns = remaining_turns;
  }

  get is_buff() {
    return this.effect_type === StatusEffectType.BUFF;
  }

  get is_debuff() {
    return this.effect_type === StatusEffectType.DEBUFF;
  }

  get is_defense() {
    return this.effect_type === StatusEffectType.DEFENSE;
  }

  toString() {
    return `${this.name} [${this.effect_type.name}] value=${this.value} turns=${this.remaining_turns}`;
  }

  compact_string() {
    const value = (this.effect_type === StatusEffectType.DEFENSE) ? `"${this.name}"` : this.value;
    return `{"type":"${this.effect_type.name}","effect":${value},"turns_left":${this.remaining_turns}}`;
  }
}

export default StatusEffect;
