import Action from "./action";
import ActionType from "../enums/actionType";
import ActionTarget from "../enums/actionTarget";

class Pass extends Action {
  constructor() {
    super(ActionType.PASS, 0, 1, 0);
  }

  perform_action_subclass() {
    return {
        succeeded: true,
        value: 0,
        action_type: ActionType.PASS,
        target: ActionTarget.SELF,
      };
  }

  range() {
    return null;
  }

  compact_effect() {
    return "Do nothing."
  }

  mana_cost() {
    return 0;
  }

  overview() {
    return "Action Type: 'PASS'";
  }

  failure_announcement() {
    throw new Error("Pass literally can't fail");
  }

  success_announcement(wizard, value) {
    return `${wizard.name} passes.`;
  }

  action_target() {
    return ActionTarget.SELF;
  }

  display_card() {
    return null;
  }
}

export default Pass;
