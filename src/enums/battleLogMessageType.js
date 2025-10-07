class BattleLogMessageType {
    constructor(name) {
      this.name = name;
    }
  
    static #values = {
      PLAYER_ACTION: new BattleLogMessageType("PLAYER_ACTION"),
      TURN_START: new BattleLogMessageType("TURN_START"),
      TURN_END: new BattleLogMessageType("TURN_END"),
      WINNER: new BattleLogMessageType("WINNER"),
      ERROR: new BattleLogMessageType("ERROR"),
    };
  
    static get PLAYER_ACTION() {
      return BattleLogMessageType.#values.PLAYER_ACTION;
    }
  
    static get TURN_START() {
      return BattleLogMessageType.#values.TURN_START;
    }
  
    static get TURN_END() {
      return BattleLogMessageType.#values.TURN_END;
    }

    static get ERROR() {
        return BattleLogMessageType.#values.ERROR;
    }

    static get WINNER() {
        return BattleLogMessageType.#values.WINNER;
    }
  
    static values() {
      return Object.values(BattleLogMessageType.#values);
    }
  
    static fromName(name) {
      if (!name) {
        throw new Error("BattleLogMessageType.fromName requires a name");
      }
      const key = String(name).toUpperCase();
      const result = BattleLogMessageType.#values[key];
      if (!result) {
        throw new Error(`Unknown BattleLogMessageType: ${name}`);
      }
      return result;
    }
  }
  
  export default BattleLogMessageType;
  