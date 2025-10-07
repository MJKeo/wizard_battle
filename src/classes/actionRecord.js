class ActionRecord {
  constructor(actor_id, type, target, result) {
    this.actor_id = actor_id;
    this.type = type;
    this.target = target;
    this.result = result;
  }
}

export default ActionRecord;
