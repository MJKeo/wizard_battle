import { useEffect, useState } from "react";
import "./App.css";
import GatherDescriptions from "./gather_descriptions";
import DisplayWizards from "./display_wizards";
import Battle from "./battle";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ?? "http://localhost:3167";

function App() {
  const [descriptions, setDescriptions] = useState(null);
  const [playerOneWizard, setPlayerOneWizard] = useState(null);
  const [playerTwoWizard, setPlayerTwoWizard] = useState(null);
  const [view, setView] = useState("gather");

  useEffect(() => {
    setPlayerOneWizard(null);
    setPlayerTwoWizard(null);
  }, []);

  const handleDescriptionsComplete = (playerOne, playerTwo) => {
    setDescriptions({ playerOne, playerTwo });
    setView("display");
  };

  const handleReset = () => {
    setDescriptions(null);
    setPlayerOneWizard(null);
    setPlayerTwoWizard(null);
    setView("gather");
  };

  const handleWizardReady = (label, wizardInstance) => {
    if (label === "Player 1") {
      setPlayerOneWizard(wizardInstance);
    } else if (label === "Player 2") {
      setPlayerTwoWizard(wizardInstance);
    }
  };

  const handleBeginBattle = () => {
    if (playerOneWizard && playerTwoWizard) {
      setView("battle");
    }
  };

  if (view === "battle" && playerOneWizard && playerTwoWizard) {
    return (
      <div className="app">
        <Battle
          playerOneWizard={playerOneWizard}
          playerTwoWizard={playerTwoWizard}
          onReset={handleReset}
          apiBaseUrl={API_BASE_URL}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {view === "gather" && (
        <GatherDescriptions onComplete={handleDescriptionsComplete} />
      )}

      {view === "display" && descriptions && (
        <DisplayWizards
          descriptions={descriptions}
          apiBaseUrl={API_BASE_URL}
          onReset={handleReset}
          onBeginBattle={handleBeginBattle}
          playerOneWizard={playerOneWizard}
          playerTwoWizard={playerTwoWizard}
          onWizardReady={handleWizardReady}
        />
      )}
    </div>
  );
}

export default App;
