import { useState } from "react";

function GatherDescriptions({ onComplete }) {
  const [phase, setPhase] = useState("player1");
  const [playerOneDraft, setPlayerOneDraft] = useState("");
  const [playerTwoDraft, setPlayerTwoDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handlePlayerOneSubmit = () => {
    if (!playerOneDraft.trim()) {
      setErrorMessage("Please describe Player 1's wizard before submitting.");
      return;
    }

    setErrorMessage("");
    setPhase("player2");
  };

  const handlePlayerTwoSubmit = () => {
    if (!playerTwoDraft.trim()) {
      setErrorMessage("Please describe Player 2's wizard before submitting.");
      return;
    }

    setErrorMessage("");
    onComplete(playerOneDraft.trim(), playerTwoDraft.trim());
  };

  const handleKeyDown = (event, phaseKey) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (phaseKey === "player1") {
        handlePlayerOneSubmit();
      } else {
        handlePlayerTwoSubmit();
      }
    }
  };

  return (
    <div className="gather-wrapper">
      <h1 className="title">Wizard Battle</h1>
      <p className="gather-summary">
        • Each player crafts lore for their champion spellcasters
        <br />• Watch the arcane forge warriors from your words
        <br />• See these wizards clash in combat!
      </p>

      {phase === "player1" && (
        <section className="prompt-card">
          <label htmlFor="player-one-prompt" className="prompt-label">
            Player 1, describe your wizard
          </label>
          <textarea
            id="player-one-prompt"
            className="prompt-input"
            value={playerOneDraft}
            onChange={(event) => setPlayerOneDraft(event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, "player1")}
            placeholder="Describe your wizard..."
          />
          <button className="prompt-button" onClick={handlePlayerOneSubmit}>
            Submit
          </button>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </section>
      )}

      {phase === "player2" && (
        <section className="prompt-card">
          <label htmlFor="player-two-prompt" className="prompt-label">
            Player 2 describe your wizard
          </label>
          <textarea
            id="player-two-prompt"
            className="prompt-input"
            value={playerTwoDraft}
            onChange={(event) => setPlayerTwoDraft(event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, "player2")}
            placeholder="Describe your wizard..."
          />
          <button className="prompt-button" onClick={handlePlayerTwoSubmit}>
            Submit
          </button>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </section>
      )}
    </div>
  );
}

export default GatherDescriptions;
