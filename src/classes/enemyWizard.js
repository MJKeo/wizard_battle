import Wizard from "./wizard";

class EnemyWizard extends Wizard {
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
    combat_style,
    preview
  ) {
    super(name, primary_element, secondary_element, attack, defense, health, healing, arcane, spells, combat_style);
    this.preview = preview;
  }
}

export default EnemyWizard;
