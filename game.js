"use strict";

/* =========================================
   DICE BENDER
   Complete physical score-sheet prototype
   ========================================= */


/* MAIN ELEMENTS */

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");

const virtualModeButton =
  document.getElementById("virtualModeButton");

const physicalModeButton =
  document.getElementById("physicalModeButton");

const computerModeButton =
  document.getElementById("computerModeButton");

const howToPlayButton =
  document.getElementById("howToPlayButton");

const backButton =
  document.getElementById("backButton");

const menuButton =
  document.getElementById("menuButton");

const mainActionButton =
  document.getElementById("mainActionButton");

const newGameButton =
  document.getElementById("newGameButton");

const modeLabel =
  document.getElementById("modeLabel");

const scoreRows = Array.from(
  document.querySelectorAll(".scoreRow")
);

const numberButtons = Array.from(
  document.querySelectorAll(".numberTrack button")
);

const penaltyButtons = Array.from(
  document.querySelectorAll(".penaltyBoxes button")
);

const lockButtons = Array.from(
  document.querySelectorAll(".lockBox")
);
const trayDice = Array.from(
  document.querySelectorAll(".trayDie")
);

/* LOCK-IN PANEL */

const lockOverlay =
  document.getElementById("lockOverlay");

const cancelLockButton =
  document.getElementById("cancelLockButton");

const confirmLockButton =
  document.getElementById("confirmLockButton");

const lockCard =
  document.querySelector(".lockCard");

const lockTitle =
  document.getElementById("lockTitle");

const lockMessage =
  lockCard.querySelector("p");


/* GAME STATE */

let currentMode = null;
let pendingSelections = [];
let pendingPenalty = null;
let gameIsOver = false;
let diceHaveBeenRolled = false;
let diceAreRolling = false;

/* SCORE DISPLAY STATE */

let totalScoreElement = null;
let penaltyScoreElement = null;

const rowScoreElements = new Map();


/* RESULTS PANEL ELEMENTS */

let resultsOverlay = null;
let resultsReason = null;
let resultsTotal = null;
let resultsRowScores = [];
let resultsPenalty = null;
let resultsNewGameButton = null;
let resultsMenuButton = null;


/* =========================================
   CREATE SCORE DISPLAYS
   ========================================= */

function createScoreDisplays() {
  scoreRows.forEach(function (row) {
    const rowElement =
      row.querySelector(".rowElement");

    const scoreElement =
      document.createElement("strong");

    scoreElement.className = "rowScore";
    scoreElement.textContent = "0";

    rowElement.appendChild(scoreElement);
    rowScoreElements.set(row, scoreElement);
  });


  const scoreHeadingRight =
    document.querySelector(
      ".scoreHeading span:last-child"
    );

  scoreHeadingRight.innerHTML =
    `Player 1 Â· <strong id="totalScore">0</strong> pts`;

  totalScoreElement =
    document.getElementById("totalScore");


  const penaltyValue =
    document.querySelector(".penaltyValue");

  penaltyValue.innerHTML =
    `<strong id="penaltyScore">0</strong> pts`;

  penaltyScoreElement =
    document.getElementById("penaltyScore");
}


/* =========================================
   CREATE RESULTS PANEL
   ========================================= */

function createResultsPanel() {
  resultsOverlay = document.createElement("div");
  resultsOverlay.className = "resultsOverlay";
  resultsOverlay.setAttribute("aria-hidden", "true");

  resultsOverlay.innerHTML = `
    <section
      class="resultsCard"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resultsTitle"
    >
      <div class="resultsElementDots" aria-hidden="true">
        <span class="resultFire"></span>
        <span class="resultAir"></span>
        <span class="resultEarth"></span>
        <span class="resultWater"></span>
      </div>

      <p class="resultsEyebrow">Game Complete</p>
      <h2 id="resultsTitle">Final Score</h2>
      <p id="resultsReason" class="resultsReason"></p>

      <div id="resultsTotal" class="resultsTotal">0</div>
      <span class="resultsPointsLabel">points</span>

      <div class="resultsBreakdown">
        <div class="resultLine fireResult">
          <span>Fire</span>
          <strong>0</strong>
        </div>

        <div class="resultLine airResult">
          <span>Air</span>
          <strong>0</strong>
        </div>

        <div class="resultLine earthResult">
          <span>Earth</span>
          <strong>0</strong>
        </div>

        <div class="resultLine waterResult">
          <span>Water</span>
          <strong>0</strong>
        </div>

        <div class="resultLine penaltyResult">
          <span>Penalties</span>
          <strong>0</strong>
        </div>
      </div>

      <div class="resultsActions">
        <button id="resultsMenuButton" type="button">
          Main Menu
        </button>

        <button id="resultsNewGameButton" type="button">
          New Game
        </button>
      </div>
    </section>
  `;

  document.body.appendChild(resultsOverlay);

  resultsReason =
    document.getElementById("resultsReason");

  resultsTotal =
    document.getElementById("resultsTotal");

  resultsRowScores = Array.from(
    document.querySelectorAll(
      ".resultsBreakdown .resultLine:not(.penaltyResult) strong"
    )
  );

  resultsPenalty =
    document.querySelector(
      ".penaltyResult strong"
    );

  resultsNewGameButton =
    document.getElementById("resultsNewGameButton");

  resultsMenuButton =
    document.getElementById("resultsMenuButton");
}

/* =========================================
   VIRTUAL DICE
   ========================================= */

const pipPositionsByValue = {
  1: [
    "center"
  ],

  2: [
    "topLeft",
    "bottomRight"
  ],

  3: [
    "topLeft",
    "center",
    "bottomRight"
  ],

  4: [
    "topLeft",
    "topRight",
    "bottomLeft",
    "bottomRight"
  ],

  5: [
    "topLeft",
    "topRight",
    "center",
    "bottomLeft",
    "bottomRight"
  ],

  6: [
    "topLeft",
    "middleLeft",
    "bottomLeft",
    "topRight",
    "middleRight",
    "bottomRight"
  ]
};


function getRandomDieValue() {
  return Math.floor(Math.random() * 6) + 1;
}


function showDieValue(die, value) {
  die.innerHTML = "";
  die.dataset.value = value;

  const dieName =
    die.getAttribute("aria-label")
      .split(" showing")[0];

  die.setAttribute(
    "aria-label",
    `${dieName} showing ${value}`
  );


  pipPositionsByValue[value].forEach(
    function (positionClass) {
      const pip =
        document.createElement("span");

      pip.className =
        `pip ${positionClass}`;

      die.appendChild(pip);
    }
  );
}


function updateDiceAvailability() {
  trayDice.forEach(function (die, index) {
    /*
      The first two dice are always the white dice.
    */

    if (index < 2) {
      die.classList.remove("removed-die");
      die.setAttribute("aria-disabled", "false");
      return;
    }


    /*
      The remaining dice match the score rows in order:
      fire, air, earth, and water.
    */

    const matchingRow =
      scoreRows[index - 2];

    const finalNumber =
      getFinalNumberButton(matchingRow);

    const rowIsLocked =
      finalNumber.classList.contains("confirmed");


    die.classList.toggle(
      "removed-die",
      rowIsLocked
    );

    die.setAttribute(
      "aria-disabled",
      rowIsLocked ? "true" : "false"
    );
  });
}




/*
  Faster in-tray animation used by the game.
  The older full-screen animation above is intentionally not called.
*/

function animateTrayDieInPlace(die, index) {
  const finalValue = getRandomDieValue();
  const delay = index * 35;
  const duration = 540;


  return new Promise(function (resolve) {
    window.setTimeout(function () {
      let temporaryValue = getRandomDieValue();

      showDieValue(die, temporaryValue);


      const faceChangeTimer =
        window.setInterval(function () {
          temporaryValue = getRandomDieValue();
          showDieValue(die, temporaryValue);
        }, 70);


      const animation =
        die.animate(
          [
            {
              transform: "rotate(0deg) scale(1)",
              offset: 0
            },

            {
              transform: "rotate(150deg) scale(0.86)",
              offset: 0.28
            },

            {
              transform: "rotate(310deg) scale(1.12)",
              offset: 0.58
            },

            {
              transform: "rotate(430deg) scale(0.94)",
              offset: 0.78
            },

            {
              transform: "rotate(360deg) scale(1)",
              offset: 1
            }
          ],

          {
            duration: duration,
            easing: "cubic-bezier(0.2, 0.72, 0.25, 1)",
            fill: "none"
          }
        );


      animation.finished
        .catch(function () {
          return undefined;
        })
        .then(function () {
          window.clearInterval(faceChangeTimer);
          showDieValue(die, finalValue);
          resolve();
        });
    }, delay);
  });
}


async function rollVirtualDice() {
  if (diceAreRolling) {
    return;
  }


  diceAreRolling = true;
  diceHaveBeenRolled = false;

  updateGameState();
  updateDiceAvailability();


  const diceTray =
    document.getElementById("diceTray");

  diceTray.setAttribute("aria-busy", "true");


  const activeDice =
    trayDice.filter(function (die) {
      return !die.classList.contains("removed-die");
    });


  const animations =
    activeDice.map(function (die, index) {
      return animateTrayDieInPlace(die, index);
    });


  await Promise.all(animations);


  diceTray.setAttribute("aria-busy", "false");

  diceAreRolling = false;
  diceHaveBeenRolled = true;

  updateGameState();
}
/* =========================================
   SCREEN CHANGING
   ========================================= */

function showStartScreen() {
  gameScreen.classList.remove("active");
  startScreen.classList.add("active");
}


function showGameScreen(mode) {
  currentMode = mode;

  modeLabel.textContent =
    mode === "virtual"
      ? "Virtual Dice"
      : "Physical Dice";
  gameScreen.classList.toggle(
    "virtual-game",
    mode === "virtual"
  );
  if (mode === "virtual") {
    diceHaveBeenRolled = false;
    mainActionButton.textContent = "Roll Dice";
  } else {
    mainActionButton.textContent = "Lock In Selections";
  }


  startScreen.classList.remove("active");
  gameScreen.classList.add("active");

  updateGameState();
}


/* =========================================
   ROW HELPERS
   ========================================= */

function getRowButtons(row) {
  return Array.from(
    row.querySelectorAll(".numberTrack button")
  );
}


function getFinalNumberButton(row) {
  const rowButtons = getRowButtons(row);

  return rowButtons[rowButtons.length - 1];
}


function getFurthestPosition(row, className) {
  const rowButtons = getRowButtons(row);
  let furthestPosition = -1;

  rowButtons.forEach(function (button, position) {
    if (
      button.classList.contains(className) &&
      position > furthestPosition
    ) {
      furthestPosition = position;
    }
  });

  return furthestPosition;
}


function getCrossedCountBeforeFinal(row) {
  return getRowButtons(row)
    .slice(0, -1)
    .filter(function (button) {
      return button.classList.contains("crossed");
    })
    .length;
}


/* =========================================
   FINAL-NUMBER ELIGIBILITY
   ========================================= */

function enforceFinalNumberRules() {
  scoreRows.forEach(function (row) {
    const finalButton =
      getFinalNumberButton(row);

    const finalIsPending =
      pendingSelections.includes(finalButton);

    const crossedBeforeFinal =
      getCrossedCountBeforeFinal(row);

    if (
      finalIsPending &&
      crossedBeforeFinal < 5
    ) {
      finalButton.classList.remove("crossed");
      finalButton.setAttribute(
        "aria-pressed",
        "false"
      );

      pendingSelections =
        pendingSelections.filter(
          function (button) {
            return button !== finalButton;
          }
        );
    }
  });
}


/* =========================================
   NUMBER AND LOCK AVAILABILITY
   ========================================= */

function updateNumberAndLockState() {
  enforceFinalNumberRules();

  scoreRows.forEach(function (row) {
    const rowButtons = getRowButtons(row);
    const finalButton =
      getFinalNumberButton(row);

    const lockButton =
      row.querySelector(".lockBox");

    const crossedBeforeFinal =
      getCrossedCountBeforeFinal(row);

    const finalIsEligible =
      crossedBeforeFinal >= 5;

    const finalIsPending =
      pendingSelections.includes(finalButton);

    const finalIsConfirmed =
      finalButton.classList.contains("confirmed");

    const furthestConfirmedPosition =
      getFurthestPosition(row, "confirmed");

    const furthestSelectedPosition =
      getFurthestPosition(row, "crossed");


    row.classList.toggle(
      "locked-row",
      finalIsConfirmed
    );

    lockButton.classList.remove("pending-lock");
    lockButton.classList.remove("confirmed-lock");
    lockButton.classList.remove("unavailable-lock");

    lockButton.disabled = true;


    if (finalIsConfirmed) {
      lockButton.classList.add("confirmed-lock");
    } else if (finalIsPending) {
      lockButton.classList.add("pending-lock");
    } else {
      lockButton.classList.add("unavailable-lock");
    }


    rowButtons.forEach(function (button, position) {
      const isCrossed =
        button.classList.contains("crossed");

      const isConfirmed =
        button.classList.contains("confirmed");

      const isFinalNumber =
        button === finalButton;

      button.classList.remove("unavailable");
      button.classList.remove("preview-unavailable");
      button.classList.remove("final-restricted");


      if (isCrossed) {
        button.disabled =
          isConfirmed || gameIsOver;

        return;
      }


      if (
        finalIsConfirmed ||
        gameIsOver
      ) {
        button.classList.add("unavailable");
        button.disabled = true;
        return;
      }


      if (position <= furthestConfirmedPosition) {
        button.classList.add("unavailable");
        button.disabled = true;
        return;
      }


      if (position <= furthestSelectedPosition) {
        button.classList.add(
          "preview-unavailable"
        );

        button.disabled = true;
        return;
      }


      if (
        isFinalNumber &&
        !finalIsEligible
      ) {
        button.classList.add("final-restricted");
        button.disabled = true;
        return;
      }


      button.disabled = false;
    });
  });
}


/* =========================================
   PENALTY AVAILABILITY
   ========================================= */

function getNextPenaltyButton() {
  return penaltyButtons.find(function (button) {
    return !button.classList.contains(
      "confirmed-penalty"
    );
  });
}


function updatePenaltyState() {
  const nextPenaltyButton =
    getNextPenaltyButton();

  penaltyButtons.forEach(function (button) {
    const isConfirmed =
      button.classList.contains(
        "confirmed-penalty"
      );

    const isPending =
      button === pendingPenalty;

    if (
      isConfirmed ||
      gameIsOver
    ) {
      button.disabled = true;
      return;
    }

    button.disabled = (
      button !== nextPenaltyButton &&
      !isPending
    );
  });
}


/* =========================================
   SCORING
   ========================================= */

function calculatePoints(crossCount) {
  return crossCount * (crossCount + 1) / 2;
}


function updateScores() {
  let totalScore = 0;
  let hasTemporaryScore = false;


  scoreRows.forEach(function (row) {
    const rowButtons = getRowButtons(row);

    const finalButton =
      getFinalNumberButton(row);

    const numberCrosses =
      rowButtons.filter(function (button) {
        return button.classList.contains("crossed");
      }).length;

    const lockCross =
      finalButton.classList.contains("crossed")
        ? 1
        : 0;

    const rowPoints =
      calculatePoints(
        numberCrosses + lockCross
      );

    const rowHasTemporarySelection =
      rowButtons.some(function (button) {
        return pendingSelections.includes(button);
      });

    const scoreElement =
      rowScoreElements.get(row);

    scoreElement.textContent = rowPoints;

    scoreElement.classList.toggle(
      "preview-score",
      rowHasTemporarySelection
    );

    if (rowHasTemporarySelection) {
      hasTemporaryScore = true;
    }

    totalScore += rowPoints;
  });


  const confirmedPenaltyCount =
    penaltyButtons.filter(function (button) {
      return button.classList.contains(
        "confirmed-penalty"
      );
    }).length;

  const displayedPenaltyCount =
    confirmedPenaltyCount +
    (pendingPenalty !== null ? 1 : 0);

  const penaltyPoints =
    displayedPenaltyCount * -5;

  penaltyScoreElement.textContent =
    penaltyPoints;

  penaltyScoreElement.classList.toggle(
    "preview-score",
    pendingPenalty !== null
  );

  if (pendingPenalty !== null) {
    hasTemporaryScore = true;
  }

  totalScore += penaltyPoints;

  totalScoreElement.textContent = totalScore;

  totalScoreElement.classList.toggle(
    "preview-score",
    hasTemporaryScore
  );
}


/* =========================================
   COMPLETE INTERFACE UPDATE
   ========================================= */

function updateGameState() {
  updateNumberAndLockState();
  updatePenaltyState();
  updateScores();
  updateDiceAvailability();

  const hasPendingChoice =
    pendingSelections.length > 0 ||
    pendingPenalty !== null;


  if (
    currentMode === "virtual" &&
    diceAreRolling
  ) {
    mainActionButton.textContent = "Rolling...";
    mainActionButton.disabled = true;
    newGameButton.disabled = true;
    return;
  }


  newGameButton.disabled = false;


  /*
    Before a virtual roll, the main button rolls the dice.
  */

  if (
    currentMode === "virtual" &&
    !diceHaveBeenRolled
  ) {
    mainActionButton.textContent = "Roll Dice";
    mainActionButton.disabled = gameIsOver;
    return;
  }


  /*
    After rolling, or in physical mode, the button
    locks in temporary selections.
  */

  mainActionButton.textContent =
    "Lock In Selections";

  mainActionButton.disabled =
    !hasPendingChoice || gameIsOver;
}

/* =========================================
   VIRTUAL DICE SELECTION RULES
   ========================================= */

function getCurrentDiceValues() {
  return {
    whiteOne: Number(trayDice[0].dataset.value),
    whiteTwo: Number(trayDice[1].dataset.value),

    fire: Number(trayDice[2].dataset.value),
    air: Number(trayDice[3].dataset.value),
    earth: Number(trayDice[4].dataset.value),
    water: Number(trayDice[5].dataset.value)
  };
}


function getButtonRowColor(button) {
  const row =
    button.closest(".scoreRow");

  if (row.classList.contains("fireRow")) {
    return "fire";
  }

  if (row.classList.contains("airRow")) {
    return "air";
  }

  if (row.classList.contains("earthRow")) {
    return "earth";
  }

  return "water";
}


function getButtonNumber(button) {
  return Number(button.textContent.trim());
}


/*
  The white action always uses both white dice.
  It may be used in any colored row.
*/

function matchesWhiteAction(button) {
  const dice = getCurrentDiceValues();

  const whiteTotal =
    dice.whiteOne + dice.whiteTwo;

  return getButtonNumber(button) === whiteTotal;
}


/*
  The colored action uses one white die plus the
  colored die matching the selected row.
*/

function matchesColoredAction(button) {
  const dice = getCurrentDiceValues();

  const rowColor =
    getButtonRowColor(button);

  const coloredValue =
    dice[rowColor];

  const selectedNumber =
    getButtonNumber(button);

  const firstColoredTotal =
    dice.whiteOne + coloredValue;

  const secondColoredTotal =
    dice.whiteTwo + coloredValue;

  return (
    selectedNumber === firstColoredTotal ||
    selectedNumber === secondColoredTotal
  );
}


/*
  Determine whether all temporary selections can be
  assigned to one white action and one colored action.

  This allows the player to complete the actions in
  whichever order is most beneficial.
*/

function virtualSelectionsAreValid(selections) {
  if (selections.length === 0) {
    return true;
  }


  if (selections.length === 1) {
    return (
      matchesWhiteAction(selections[0]) ||
      matchesColoredAction(selections[0])
    );
  }


  if (selections.length === 2) {
    const firstSelection = selections[0];
    const secondSelection = selections[1];

    const firstIsWhiteSecondIsColored =
      matchesWhiteAction(firstSelection) &&
      matchesColoredAction(secondSelection);

    const firstIsColoredSecondIsWhite =
      matchesColoredAction(firstSelection) &&
      matchesWhiteAction(secondSelection);

    return (
      firstIsWhiteSecondIsColored ||
      firstIsColoredSecondIsWhite
    );
  }


  return false;
}
/* =========================================
   NUMBER SELECTIONS
   ========================================= */

function selectNumber(button) {
  if (
    gameIsOver ||
    (
      currentMode === "virtual" &&
      !diceHaveBeenRolled
    ) ||
    button.classList.contains("confirmed")
  ) {
    return;
  }


  if (pendingSelections.includes(button)) {
    button.classList.remove("crossed");

    button.setAttribute(
      "aria-pressed",
      "false"
    );

    pendingSelections =
      pendingSelections.filter(
        function (selectedButton) {
          return selectedButton !== button;
        }
      );

    updateGameState();
    return;
  }


  if (pendingPenalty !== null) {
    return;
  }


  if (
    button.classList.contains("unavailable") ||
    button.classList.contains("preview-unavailable") ||
    button.classList.contains("final-restricted")
  ) {
    return;
  }


  if (pendingSelections.length >= 2) {
    return;
  }


  /*
    Test the possible selection before adding it.
  */

  const possibleSelections = [
    ...pendingSelections,
    button
  ];


  if (
    currentMode === "virtual" &&
    !virtualSelectionsAreValid(possibleSelections)
  ) {
    return;
  }


  button.classList.add("crossed");

  button.setAttribute(
    "aria-pressed",
    "true"
  );

  pendingSelections.push(button);

  updateGameState();
}


/* =========================================
   PENALTY SELECTION
   ========================================= */

function selectPenalty(button) {
  if (
    gameIsOver ||
    (
      currentMode === "virtual" &&
      !diceHaveBeenRolled
    )
  ) {
    return;
  }


  if (button === pendingPenalty) {
    button.classList.remove("pending-penalty");

    button.setAttribute(
      "aria-pressed",
      "false"
    );

    pendingPenalty = null;

    updateGameState();
    return;
  }


  if (
    pendingSelections.length > 0 ||
    button.classList.contains(
      "confirmed-penalty"
    ) ||
    button !== getNextPenaltyButton()
  ) {
    return;
  }


  pendingPenalty = button;

  button.classList.add("pending-penalty");

  button.setAttribute(
    "aria-pressed",
    "true"
  );

  updateGameState();
}


/* =========================================
   LOCK CONFIRMATION
   ========================================= */

function pendingChoiceWillEndGame() {
  const penaltyWillEndGame =
    pendingPenalty !== null &&
    getConfirmedPenaltyCount() === 3;


  const pendingRowLocks =
    scoreRows.filter(function (row) {
      const finalButton =
        getFinalNumberButton(row);

      const alreadyLocked =
        finalButton.classList.contains("confirmed");

      const willBecomeLocked =
        pendingSelections.includes(finalButton);

      return (
        !alreadyLocked &&
        willBecomeLocked
      );
    }).length;


  const rowLockWillEndGame =
    getLockedRowCount() + pendingRowLocks >= 2;


  return (
    penaltyWillEndGame ||
    rowLockWillEndGame
  );
}


function positionLockPanel() {
  const buttonPosition =
    mainActionButton.getBoundingClientRect();

  const panelGap = 5;
  const panelHeight = lockCard.offsetHeight;

  let panelTop =
    buttonPosition.bottom + panelGap;


  if (
    panelTop + panelHeight >
    window.innerHeight - 6
  ) {
    panelTop =
      buttonPosition.top -
      panelHeight -
      panelGap;
  }


  lockCard.style.left =
    `${buttonPosition.left}px`;

  lockCard.style.top =
    `${panelTop}px`;

  lockCard.style.width =
    `${buttonPosition.width}px`;
}


function openLockPanel() {
  const hasPendingChoice =
    pendingSelections.length > 0 ||
    pendingPenalty !== null;


  if (
    gameIsOver ||
    !hasPendingChoice
  ) {
    return;
  }


  const willEndGame =
    pendingChoiceWillEndGame();


  lockCard.classList.toggle(
    "ending-warning",
    willEndGame
  );


  if (willEndGame) {
    lockTitle.textContent =
      "This ends the game";

    lockMessage.textContent =
      "Your current score will become final.";

    cancelLockButton.textContent =
      "Go Back";

    confirmLockButton.textContent =
      "End Game";
  } else {
    lockTitle.textContent =
      "Lock it in?";

    lockMessage.textContent =
      "These selections will become permanent.";

    cancelLockButton.textContent =
      "Keep Choosing";

    confirmLockButton.textContent =
      "Lock It In";
  }


  lockOverlay.classList.add("open");

  lockOverlay.setAttribute(
    "aria-hidden",
    "false"
  );


  positionLockPanel();
  confirmLockButton.focus();
}


function closeLockPanel() {
  lockOverlay.classList.remove("open");

  lockOverlay.setAttribute(
    "aria-hidden",
    "true"
  );
}

/* =========================================
   RESULTS
   ========================================= */

function getConfirmedPenaltyCount() {
  return penaltyButtons.filter(function (button) {
    return button.classList.contains(
      "confirmed-penalty"
    );
  }).length;
}


function getLockedRowCount() {
  return scoreRows.filter(function (row) {
    return getFinalNumberButton(row)
      .classList.contains("confirmed");
  }).length;
}


function openResultsPanel(reason) {
  gameIsOver = true;

  closeLockPanel();
  updateGameState();

  resultsReason.textContent = reason;
  resultsTotal.textContent =
    totalScoreElement.textContent;

  scoreRows.forEach(function (row, index) {
    resultsRowScores[index].textContent =
      rowScoreElements.get(row).textContent;
  });

  resultsPenalty.textContent =
    penaltyScoreElement.textContent;

  resultsOverlay.classList.add("open");

  resultsOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  resultsNewGameButton.focus();
}


function closeResultsPanel() {
  resultsOverlay.classList.remove("open");

  resultsOverlay.setAttribute(
    "aria-hidden",
    "true"
  );
}


function checkForGameEnd() {
  if (getConfirmedPenaltyCount() >= 4) {
    openResultsPanel(
      "Four penalties ended the game."
    );

    return;
  }

  if (getLockedRowCount() >= 2) {
    openResultsPanel(
      "Two elemental rows were locked."
    );
  }
}


/* =========================================
   FINALIZING A TURN
   ========================================= */

function confirmSelections() {
  pendingSelections.forEach(function (button) {
    button.classList.add("confirmed");
  });

  pendingSelections = [];


  if (pendingPenalty !== null) {
    pendingPenalty.classList.remove(
      "pending-penalty"
    );

    pendingPenalty.classList.add(
      "confirmed-penalty"
    );

    pendingPenalty.disabled = true;
    pendingPenalty = null;
  }


  closeLockPanel();

  if (currentMode === "virtual") {
    diceHaveBeenRolled = false;
  }

  updateGameState();
  checkForGameEnd();
}


/* =========================================
   CLEAR TEMPORARY CHOICES
   ========================================= */

function clearPendingChoices() {
  pendingSelections.forEach(function (button) {
    button.classList.remove("crossed");

    button.setAttribute(
      "aria-pressed",
      "false"
    );
  });

  pendingSelections = [];


  if (pendingPenalty !== null) {
    pendingPenalty.classList.remove(
      "pending-penalty"
    );

    pendingPenalty.setAttribute(
      "aria-pressed",
      "false"
    );

    pendingPenalty = null;
  }


  closeLockPanel();
  updateGameState();
}


/* =========================================
   NEW GAME
   ========================================= */

function clearEntireScoreSheet() {
  gameIsOver = false;
  diceHaveBeenRolled = false;
  diceAreRolling = false;
  numberButtons.forEach(function (button) {
    button.classList.remove(
      "crossed",
      "confirmed",
      "unavailable",
      "preview-unavailable",
      "final-restricted"
    );

    button.setAttribute(
      "aria-pressed",
      "false"
    );

    button.disabled = false;
  });


  penaltyButtons.forEach(function (button) {
    button.classList.remove(
      "pending-penalty",
      "confirmed-penalty"
    );

    button.setAttribute(
      "aria-pressed",
      "false"
    );

    button.disabled = false;
  });


  lockButtons.forEach(function (button) {
    button.classList.remove(
      "pending-lock",
      "confirmed-lock",
      "unavailable-lock"
    );
  });


  scoreRows.forEach(function (row) {
    row.classList.remove("locked-row");
  });


  pendingSelections = [];
  pendingPenalty = null;

  closeLockPanel();
  closeResultsPanel();
  updateGameState();
}


/* =========================================
   INITIAL DISPLAY SETUP
   ========================================= */

createScoreDisplays();
createResultsPanel();


/* =========================================
   BUTTON ACTIONS
   ========================================= */

numberButtons.forEach(function (button) {
  button.setAttribute(
    "aria-pressed",
    "false"
  );

  button.addEventListener("click", function () {
    selectNumber(button);
  });
});


penaltyButtons.forEach(function (button) {
  button.setAttribute(
    "aria-pressed",
    "false"
  );

  button.addEventListener("click", function () {
    selectPenalty(button);
  });
});


virtualModeButton.addEventListener("click", function () {
  gameScreen.classList.remove("computer-game");

  showGameScreen("virtual");
});


computerModeButton.addEventListener("click", function () {
  showGameScreen("virtual");

  gameScreen.classList.add("computer-game");
  modeLabel.textContent = "You vs Computer";
});


physicalModeButton.addEventListener("click", function () {
  gameScreen.classList.remove("computer-game");

  showGameScreen("physical");
});


howToPlayButton.addEventListener("click", function () {
  window.alert(
    "Full instructions will be added after the basic game rules are working."
  );
});


backButton.addEventListener("click", function () {
  showStartScreen();
});


menuButton.addEventListener("click", function () {
  window.alert(
    "The game menu will be added in a later development stage."
  );
});


mainActionButton.addEventListener(
  "click",
  async function () {
    if (
      currentMode === "virtual" &&
      !diceHaveBeenRolled
    ) {
      await rollVirtualDice();
      return;
    }


    openLockPanel();
  }
);

cancelLockButton.addEventListener("click", function () {
  clearPendingChoices();
});


confirmLockButton.addEventListener("click", function () {
  confirmSelections();
});


lockOverlay.addEventListener("click", function (event) {
  if (event.target === lockOverlay) {
    closeLockPanel();
  }
});


newGameButton.addEventListener("click", function () {
  const shouldStartNewGame = window.confirm(
    "Start a new game? The entire score sheet will be cleared."
  );

  if (shouldStartNewGame) {
    clearEntireScoreSheet();
  }
});


resultsNewGameButton.addEventListener(
  "click",
  function () {
    clearEntireScoreSheet();
  }
);


resultsMenuButton.addEventListener(
  "click",
  function () {
    clearEntireScoreSheet();
    showStartScreen();
  }
);


document.addEventListener("keydown", function (event) {
  if (
    event.key === "Escape" &&
    lockOverlay.classList.contains("open")
  ) {
    closeLockPanel();
  }
});


window.addEventListener("resize", function () {
  if (lockOverlay.classList.contains("open")) {
    positionLockPanel();
  }
});


/* INITIAL GAME STATE */

updateGameState();
/* =========================================
   COMPUTER OPPONENT STATUS PANEL
   ========================================= */

function createComputerStatusPanel() {
  const computerPanel =
    document.createElement("section");

  computerPanel.id = "computerStatusPanel";
  computerPanel.className = "computerStatusPanel";

  computerPanel.innerHTML = `
    <div class="computerPlayer humanPlayer">
      <span>You</span>
      <strong id="computerModeHumanScore">0</strong>
    </div>

    <div class="computerTurnStatus">
      <strong id="computerTurnLabel">Your Turn</strong>
      <small id="computerTurnInstruction">Roll the dice</small>
    </div>

    <div class="computerPlayer cpuPlayer">
      <span>Computer</span>
      <strong id="computerScore">0</strong>
    </div>
  `;


  const scoreCard =
    document.querySelector(".scoreCard");

  scoreCard.insertAdjacentElement(
    "beforebegin",
    computerPanel
  );


  /*
    Keep the panel's human score synchronized with
    the score already calculated by the game.
  */

  const computerModeHumanScore =
    document.getElementById(
      "computerModeHumanScore"
    );

  const humanScoreObserver =
    new MutationObserver(function () {
      computerModeHumanScore.textContent =
        totalScoreElement.textContent;
    });

  humanScoreObserver.observe(
    totalScoreElement,
    {
      childList: true,
      characterData: true,
      subtree: true
    }
  );
}


createComputerStatusPanel();
/* =========================================
   COMPUTER TURN FLOW — PRIVATE OPPONENT
   ========================================= */

let computerTurnPhase = "human";
let computerRollTimer = null;

const originalRollVirtualDice = rollVirtualDice;
const originalUpdateGameState = updateGameState;
const originalConfirmSelections = confirmSelections;
const originalClearEntireScoreSheet =
  clearEntireScoreSheet;
const originalShowStartScreen = showStartScreen;
const originalVirtualSelectionsAreValid =
  virtualSelectionsAreValid;
const originalSelectPenalty = selectPenalty;
const originalOpenLockPanel = openLockPanel;


function isComputerGame() {
  return gameScreen.classList.contains(
    "computer-game"
  );
}


function getComputerTurnLabel() {
  return document.getElementById(
    "computerTurnLabel"
  );
}


function getComputerTurnInstruction() {
  return document.getElementById(
    "computerTurnInstruction"
  );
}


function setComputerPanelText(
  title,
  instruction
) {
  const titleElement =
    getComputerTurnLabel();

  const instructionElement =
    getComputerTurnInstruction();

  if (titleElement) {
    titleElement.textContent = title;
  }

  if (instructionElement) {
    instructionElement.textContent =
      instruction;
  }
}


function setComputerDiceAppearance() {
  trayDice.forEach(function (die, index) {
    die.classList.toggle(
      "computer-waiting-die",
      isComputerGame() &&
      computerTurnPhase === "computer" &&
      index >= 2
    );
  });
}


function beginHumanTurn() {
  computerTurnPhase = "human";
  diceHaveBeenRolled = false;

  setComputerPanelText(
    "Your Turn",
    "Roll all active dice"
  );

  setComputerDiceAppearance();
  originalUpdateGameState();
}


async function beginComputerTurn() {
  if (!isComputerGame() || gameIsOver) {
    return;
  }

  computerTurnPhase = "computer";
  diceHaveBeenRolled = false;

  setComputerPanelText(
    "Computer’s Turn",
    "Watch the two white dice"
  );

  setComputerDiceAppearance();
  originalUpdateGameState();

  await rollVirtualDice();
}


/*
  During a computer turn, only the two white
  dice roll. The colored dice remain unchanged.
*/

rollVirtualDice = async function () {
  if (
    !isComputerGame() ||
    computerTurnPhase === "human"
  ) {
    await originalRollVirtualDice();
    return;
  }

  if (diceAreRolling) {
    return;
  }

  diceAreRolling = true;
  diceHaveBeenRolled = false;

  setComputerPanelText(
    "Computer’s Turn",
    "Rolling the white dice…"
  );

  originalUpdateGameState();

  const diceTray =
    document.getElementById("diceTray");

  diceTray.setAttribute(
    "aria-busy",
    "true"
  );

  await Promise.all([
    animateTrayDieInPlace(trayDice[0], 0),
    animateTrayDieInPlace(trayDice[1], 1)
  ]);

  diceTray.setAttribute(
    "aria-busy",
    "false"
  );

  diceAreRolling = false;
  diceHaveBeenRolled = true;

  setComputerPanelText(
    "Computer’s Turn",
    "Use the white dice or skip"
  );

  setComputerDiceAppearance();
  originalUpdateGameState();
};


/*
  On the computer's turn, the player may only
  use the total of the two white dice once.
*/

virtualSelectionsAreValid =
  function (selections) {
    if (
      isComputerGame() &&
      computerTurnPhase === "computer"
    ) {
      return (
        selections.length <= 1 &&
        (
          selections.length === 0 ||
          matchesWhiteAction(selections[0])
        )
      );
    }

    return originalVirtualSelectionsAreValid(
      selections
    );
  };


/*
  Penalties cannot be selected during the
  computer's turn.
*/

selectPenalty = function (button) {
  if (
    isComputerGame() &&
    computerTurnPhase === "computer"
  ) {
    return;
  }

  originalSelectPenalty(button);
};


updateGameState = function () {
  originalUpdateGameState();
  setComputerDiceAppearance();

  if (!isComputerGame()) {
    return;
  }

  if (
    computerTurnPhase === "computer" &&
    diceAreRolling
  ) {
    mainActionButton.textContent =
      "Rolling…";

    mainActionButton.disabled = true;
    return;
  }

  if (
    computerTurnPhase === "computer" &&
    diceHaveBeenRolled
  ) {
    mainActionButton.textContent =
      pendingSelections.length > 0
        ? "Lock In Selection"
        : "Skip White Dice";

    mainActionButton.disabled =
      gameIsOver;

    return;
  }

  setComputerPanelText(
    "Your Turn",
    diceHaveBeenRolled
      ? "Choose your moves"
      : "Roll all active dice"
  );
};


function finishComputerResponse() {
  clearPendingChoices();

  setComputerPanelText(
    "Computer’s Turn",
    "Finishing privately…"
  );

  mainActionButton.disabled = true;

  window.clearTimeout(
    computerRollTimer
  );

  computerRollTimer =
    window.setTimeout(
      function () {
        beginHumanTurn();
      },
      650
    );
}


/*
  The Skip White Dice button advances without
  opening the confirmation panel.
*/

openLockPanel = function () {
  if (
    isComputerGame() &&
    computerTurnPhase === "computer" &&
    pendingSelections.length === 0
  ) {
    finishComputerResponse();
    return;
  }

  originalOpenLockPanel();
};


/*
  After the human locks their normal turn,
  the computer turn begins.

  After the human responds to the computer's
  white dice, play returns to the human.
*/

confirmSelections = function () {
  const completedComputerResponse =
    isComputerGame() &&
    computerTurnPhase === "computer";

  originalConfirmSelections();

  if (gameIsOver) {
    return;
  }

  if (completedComputerResponse) {
    setComputerPanelText(
      "Computer’s Turn",
      "Finishing privately…"
    );

    mainActionButton.disabled = true;

    window.clearTimeout(
      computerRollTimer
    );

    computerRollTimer =
      window.setTimeout(
        function () {
          beginHumanTurn();
        },
        650
      );

    return;
  }

  if (isComputerGame()) {
    window.clearTimeout(
      computerRollTimer
    );

    computerRollTimer =
      window.setTimeout(
        function () {
          beginComputerTurn();
        },
        500
      );
  }
};


clearEntireScoreSheet = function () {
  window.clearTimeout(
    computerRollTimer
  );

  computerTurnPhase = "human";

  originalClearEntireScoreSheet();

  if (isComputerGame()) {
    beginHumanTurn();
  }
};


showStartScreen = function () {
  window.clearTimeout(
    computerRollTimer
  );

  computerTurnPhase = "human";
  setComputerDiceAppearance();

  originalShowStartScreen();
};


/*
  Convert the old score-versus-score panel into
  one private turn-status panel.
*/

computerModeButton.addEventListener(
  "click",
  function () {
    computerTurnPhase = "human";

    const panel =
      document.getElementById(
        "computerStatusPanel"
      );

    if (panel) {
      panel.innerHTML = `
        <div class="computerTurnStatus privateTurnStatus">
          <strong id="computerTurnLabel">
            Your Turn
          </strong>

          <small id="computerTurnInstruction">
            Roll all active dice
          </small>
        </div>
      `;
    }

    beginHumanTurn();
  }
);


virtualModeButton.addEventListener(
  "click",
  function () {
    window.clearTimeout(
      computerRollTimer
    );

    computerTurnPhase = "human";
    setComputerDiceAppearance();
  }
);


physicalModeButton.addEventListener(
  "click",
  function () {
    window.clearTimeout(
      computerRollTimer
    );

    computerTurnPhase = "human";
    setComputerDiceAppearance();
  }
);
/* =========================================
   SKIP BUTTON OVER COLORED DICE
   ========================================= */

let computerTurnIsFinishing = false;

const diceTrayElement =
  document.getElementById("diceTray");

const skipComputerWhiteButton =
  document.createElement("button");

skipComputerWhiteButton.id =
  "skipComputerWhiteButton";

skipComputerWhiteButton.type = "button";
skipComputerWhiteButton.textContent =
  "Skip White Dice";

skipComputerWhiteButton.setAttribute(
  "aria-label",
  "Skip using the computer's white dice"
);

diceTrayElement.appendChild(
  skipComputerWhiteButton
);


/*
  Show the button over the colored dice only
  after the computer's white dice have settled.
*/

function updateComputerSkipButton() {
  const shouldShow =
    isComputerGame() &&
    computerTurnPhase === "computer" &&
    diceHaveBeenRolled &&
    !diceAreRolling &&
    !computerTurnIsFinishing;

  skipComputerWhiteButton.classList.toggle(
    "visible",
    shouldShow
  );

  skipComputerWhiteButton.disabled =
    !shouldShow;
}


/*
  Add the skip-button update to the existing
  interface updates.
*/

const computerUpdateGameState =
  updateGameState;

updateGameState = function () {
  computerUpdateGameState();
  updateComputerSkipButton();

  if (
    isComputerGame() &&
    computerTurnPhase === "computer" &&
    diceHaveBeenRolled &&
    !diceAreRolling &&
    !computerTurnIsFinishing
  ) {
    if (pendingSelections.length > 0) {
      mainActionButton.textContent =
        "Lock In Selection";

      mainActionButton.disabled = false;
    } else {
      mainActionButton.textContent =
        "Select a Number";

      mainActionButton.disabled = true;
    }
  }
};


/*
  The dice appearance function is called as
  soon as the white dice finish rolling.
*/

const computerSetDiceAppearance =
  setComputerDiceAppearance;

setComputerDiceAppearance = function () {
  computerSetDiceAppearance();
  updateComputerSkipButton();
};


/*
  Hide the skip button while the computer
  privately completes its turn.
*/

const computerFinishResponse =
  finishComputerResponse;

finishComputerResponse = function () {
  computerTurnIsFinishing = true;
  updateComputerSkipButton();
  computerFinishResponse();
};


const computerConfirmSelections =
  confirmSelections;

confirmSelections = function () {
  if (
    isComputerGame() &&
    computerTurnPhase === "computer"
  ) {
    computerTurnIsFinishing = true;
    updateComputerSkipButton();
  }

  computerConfirmSelections();
};


/*
  Reset the button when either new turn begins.
*/

const computerBeginHumanTurn =
  beginHumanTurn;

beginHumanTurn = function () {
  computerTurnIsFinishing = false;
  computerBeginHumanTurn();
  updateComputerSkipButton();
};


const computerBeginComputerTurn =
  beginComputerTurn;

beginComputerTurn = async function () {
  computerTurnIsFinishing = false;
  updateComputerSkipButton();

  await computerBeginComputerTurn();

  updateComputerSkipButton();
};


/*
  Tapping Skip clears any temporary white-dice
  choice and finishes the computer's turn.
*/

skipComputerWhiteButton.addEventListener(
  "click",
  function () {
    if (
      !isComputerGame() ||
      computerTurnPhase !== "computer" ||
      !diceHaveBeenRolled ||
      diceAreRolling
    ) {
      return;
    }

    lockCard.classList.remove(
      "ending-warning"
    );

    lockTitle.textContent =
      "Skip white dice?";

    lockMessage.textContent =
      "You will not use this white dice roll.";

    cancelLockButton.textContent =
      "Keep Choosing";

    confirmLockButton.textContent =
      "Skip Roll";

    lockOverlay.classList.add("open");

    lockOverlay.setAttribute(
      "aria-hidden",
      "false"
    );

    positionLockPanel();
    confirmLockButton.focus();
  }
);


updateComputerSkipButton();

/* =========================================
   HIDDEN COMPUTER SCORE SHEET AND STRATEGY
   ========================================= */

const computerRowOrder = [
  "fire",
  "air",
  "earth",
  "water"
];

const computerRowNumbers = {
  fire: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  air: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  earth: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  water: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
};

let computerSheet = createFreshComputerSheet();
let computerSecretColoredDice = null;
let pendingComputerWhiteChoice = null;


function createFreshComputerSheet() {
  return {
    rows: {
      fire: {
        furthestPosition: -1,
        crossCount: 0,
        locked: false
      },

      air: {
        furthestPosition: -1,
        crossCount: 0,
        locked: false
      },

      earth: {
        furthestPosition: -1,
        crossCount: 0,
        locked: false
      },

      water: {
        furthestPosition: -1,
        crossCount: 0,
        locked: false
      }
    },

    penalties: 0
  };
}


function getHumanRow(color) {
  return scoreRows[
    computerRowOrder.indexOf(color)
  ];
}


function humanLockedColor(color) {
  const row = getHumanRow(color);

  return getFinalNumberButton(row)
    .classList.contains("confirmed");
}


function colorIsLockedForEveryone(color) {
  return (
    humanLockedColor(color) ||
    computerSheet.rows[color].locked
  );
}


function computerCanCross(
  sheet,
  color,
  number
) {
  const rowState = sheet.rows[color];

  if (
    colorIsLockedForEveryone(color) ||
    rowState.locked
  ) {
    return false;
  }

  const position =
    computerRowNumbers[color]
      .indexOf(number);

  if (
    position < 0 ||
    position <= rowState.furthestPosition
  ) {
    return false;
  }

  const isFinalNumber =
    position ===
    computerRowNumbers[color].length - 1;

  if (
    isFinalNumber &&
    rowState.crossCount < 5
  ) {
    return false;
  }

  return true;
}


function copyComputerSheet(sheet) {
  const copy = createFreshComputerSheet();

  copy.penalties = sheet.penalties;

  computerRowOrder.forEach(function (color) {
    copy.rows[color] = {
      furthestPosition:
        sheet.rows[color].furthestPosition,

      crossCount:
        sheet.rows[color].crossCount,

      locked:
        sheet.rows[color].locked
    };
  });

  return copy;
}


function applyComputerCrossToSheet(
  sheet,
  color,
  number
) {
  if (
    !computerCanCross(
      sheet,
      color,
      number
    )
  ) {
    return false;
  }

  const rowState = sheet.rows[color];

  const position =
    computerRowNumbers[color]
      .indexOf(number);

  rowState.furthestPosition = position;
  rowState.crossCount += 1;

  if (
    position ===
    computerRowNumbers[color].length - 1
  ) {
    rowState.locked = true;
  }

  return true;
}


function scoreComputerSheet(sheet) {
  let total = 0;

  computerRowOrder.forEach(function (color) {
    const rowState = sheet.rows[color];

    const scoringCrosses =
      rowState.crossCount +
      (rowState.locked ? 1 : 0);

    total += calculatePoints(
      scoringCrosses
    );
  });

  total -= sheet.penalties * 5;

  return total;
}


function computerChoiceValue(
  sheetBefore,
  sheetAfter,
  choices
) {
  let value =
    scoreComputerSheet(sheetAfter) -
    scoreComputerSheet(sheetBefore);

  choices.forEach(function (choice) {
    const rowBefore =
      sheetBefore.rows[choice.color];

    const newPosition =
      computerRowNumbers[choice.color]
        .indexOf(choice.number);

    const skippedSpaces =
      newPosition -
      rowBefore.furthestPosition -
      1;

    value -= skippedSpaces * 0.42;

    if (
      newPosition >= 8 &&
      rowBefore.crossCount < 4
    ) {
      value -= 1.5;
    }

    if (newPosition === 10) {
      value += 6;
    }
  });

  value += Math.random() * 0.35;

  return value;
}


function getComputerWhiteChoices(
  whiteTotal
) {
  return computerRowOrder
    .filter(function (color) {
      return computerCanCross(
        computerSheet,
        color,
        whiteTotal
      );
    })
    .map(function (color) {
      return {
        type: "white",
        color: color,
        number: whiteTotal
      };
    });
}


function getComputerColoredChoices(
  whiteOne,
  whiteTwo,
  coloredDice
) {
  const choices = [];

  computerRowOrder.forEach(function (color) {
    const totals = new Set([
      whiteOne + coloredDice[color],
      whiteTwo + coloredDice[color]
    ]);

    totals.forEach(function (total) {
      if (
        computerCanCross(
          computerSheet,
          color,
          total
        )
      ) {
        choices.push({
          type: "colored",
          color: color,
          number: total
        });
      }
    });
  });

  return choices;
}


function findBestComputerTurn(
  whiteOne,
  whiteTwo,
  coloredDice
) {
  const whiteChoices =
    getComputerWhiteChoices(
      whiteOne + whiteTwo
    );

  const coloredChoices =
    getComputerColoredChoices(
      whiteOne,
      whiteTwo,
      coloredDice
    );

  const possiblePlans = [];

  whiteChoices.forEach(function (choice) {
    possiblePlans.push([choice]);
  });

  coloredChoices.forEach(function (choice) {
    possiblePlans.push([choice]);
  });

  whiteChoices.forEach(function (whiteChoice) {
    coloredChoices.forEach(
      function (coloredChoice) {
        possiblePlans.push([
          whiteChoice,
          coloredChoice
        ]);

        possiblePlans.push([
          coloredChoice,
          whiteChoice
        ]);
      }
    );
  });

  let bestPlan = [];
  let bestValue = -Infinity;

  possiblePlans.forEach(function (plan) {
    const simulatedSheet =
      copyComputerSheet(computerSheet);

    const planIsLegal =
      plan.every(function (choice) {
        return applyComputerCrossToSheet(
          simulatedSheet,
          choice.color,
          choice.number
        );
      });

    if (!planIsLegal) {
      return;
    }

    const planValue =
      computerChoiceValue(
        computerSheet,
        simulatedSheet,
        plan
      );

    if (planValue > bestValue) {
      bestValue = planValue;
      bestPlan = plan;
    }
  });

  return bestPlan;
}


function applyComputerPlan(plan) {
  plan.forEach(function (choice) {
    applyComputerCrossToSheet(
      computerSheet,
      choice.color,
      choice.number
    );
  });

  updateGameState();
}


function chooseComputerWhiteResponse(
  whiteTotal
) {
  const choices =
    getComputerWhiteChoices(whiteTotal);

  if (choices.length === 0) {
    return null;
  }

  let bestChoice = null;
  let bestValue = -Infinity;

  choices.forEach(function (choice) {
    const simulatedSheet =
      copyComputerSheet(computerSheet);

    applyComputerCrossToSheet(
      simulatedSheet,
      choice.color,
      choice.number
    );

    const value =
      computerChoiceValue(
        computerSheet,
        simulatedSheet,
        [choice]
      );

    if (value > bestValue) {
      bestValue = value;
      bestChoice = choice;
    }
  });

  return bestChoice;
}


function computerLockedRowCount() {
  return computerRowOrder.filter(
    function (color) {
      return colorIsLockedForEveryone(color);
    }
  ).length;
}


function computerGameEndReason() {
  if (getConfirmedPenaltyCount() >= 4) {
    return "Four of your penalties ended the game.";
  }

  if (computerSheet.penalties >= 4) {
    return "Four computer penalties ended the game.";
  }

  if (computerLockedRowCount() >= 2) {
    return "Two elemental rows were locked.";
  }

  return null;
}


/*
  Make rows locked by the computer unavailable
  without revealing its other marks.
*/

const hiddenComputerNumberState =
  updateNumberAndLockState;

updateNumberAndLockState = function () {
  hiddenComputerNumberState();

  computerRowOrder.forEach(function (
    color,
    index
  ) {
    if (!computerSheet.rows[color].locked) {
      return;
    }

    const row = scoreRows[index];

    const lockButton =
      row.querySelector(".lockBox");

    row.classList.add("locked-row");

    lockButton.classList.remove(
      "pending-lock",
      "unavailable-lock"
    );

    lockButton.classList.add(
      "confirmed-lock"
    );

    getRowButtons(row).forEach(
      function (button) {
        if (
          !button.classList.contains(
            "confirmed"
          )
        ) {
          button.classList.add(
            "unavailable"
          );

          button.disabled = true;
        }
      }
    );
  });
};


const hiddenComputerDiceAvailability =
  updateDiceAvailability;

updateDiceAvailability = function () {
  hiddenComputerDiceAvailability();

  computerRowOrder.forEach(function (
    color,
    index
  ) {
    if (!computerSheet.rows[color].locked) {
      return;
    }

    const die = trayDice[index + 2];

    die.classList.add("removed-die");

    die.setAttribute(
      "aria-disabled",
      "true"
    );
  });
};


const normalLockedRowCount =
  getLockedRowCount;

getLockedRowCount = function () {
  if (!isComputerGame()) {
    return normalLockedRowCount();
  }

  return computerLockedRowCount();
};


/*
  Secretly create colored dice for the
  computer. Only the white dice remain visible.
*/

const hiddenComputerRollVirtualDice =
  rollVirtualDice;

rollVirtualDice = async function () {
  const computerIsRolling =
    isComputerGame() &&
    computerTurnPhase === "computer";

  const humanIsRollingAgainstComputer =
    isComputerGame() &&
    computerTurnPhase === "human";

  if (computerIsRolling) {
    computerSecretColoredDice = {
      fire: getRandomDieValue(),
      air: getRandomDieValue(),
      earth: getRandomDieValue(),
      water: getRandomDieValue()
    };
  }

  await hiddenComputerRollVirtualDice();

  if (
    computerIsRolling &&
    diceHaveBeenRolled &&
    !gameIsOver
  ) {
    const dice = getCurrentDiceValues();

    const plan = findBestComputerTurn(
      dice.whiteOne,
      dice.whiteTwo,
      computerSecretColoredDice
    );

    if (plan.length > 0) {
      applyComputerPlan(plan);
    } else {
      computerSheet.penalties += 1;
    }
  }

  if (
    humanIsRollingAgainstComputer &&
    diceHaveBeenRolled &&
    !gameIsOver
  ) {
    const dice = getCurrentDiceValues();

    pendingComputerWhiteChoice =
      chooseComputerWhiteResponse(
        dice.whiteOne + dice.whiteTwo
      );
  }
};


/*
  Apply the computer's private white-dice
  response after the player locks their turn.
*/

const hiddenComputerConfirmSelections =
  confirmSelections;

confirmSelections = function () {
  const humanCompletedActiveTurn =
    isComputerGame() &&
    computerTurnPhase === "human";

  hiddenComputerConfirmSelections();

  if (
    humanCompletedActiveTurn &&
    pendingComputerWhiteChoice
  ) {
    applyComputerPlan([
      pendingComputerWhiteChoice
    ]);

    pendingComputerWhiteChoice = null;
  }

  const reason =
    isComputerGame()
      ? computerGameEndReason()
      : null;

  if (reason && !gameIsOver) {
    window.clearTimeout(
      computerRollTimer
    );

    openResultsPanel(reason);
  }
};


/*
  Check for a computer-created ending before
  beginning the player's next turn.
*/

const hiddenComputerBeginHumanTurn =
  beginHumanTurn;

beginHumanTurn = function () {
  const reason =
    isComputerGame()
      ? computerGameEndReason()
      : null;

  if (reason) {
    window.clearTimeout(
      computerRollTimer
    );

    openResultsPanel(reason);
    return;
  }

  hiddenComputerBeginHumanTurn();
};


/*
  Reveal the computer score only on the final
  results screen.
*/

const normalOpenResultsPanel =
  openResultsPanel;

openResultsPanel = function (reason) {
  normalOpenResultsPanel(reason);

  let comparison =
    document.getElementById(
      "computerFinalComparison"
    );

  if (!comparison) {
    comparison =
      document.createElement("div");

    comparison.id =
      "computerFinalComparison";

    comparison.style.margin =
      "10px 0 2px";

    comparison.style.padding =
      "9px 11px";

    comparison.style.border =
      "1px solid rgba(220, 194, 255, 0.32)";

    comparison.style.borderRadius =
      "12px";

    comparison.style.background =
      "rgba(92, 57, 145, 0.18)";

    comparison.style.textAlign =
      "center";

    const breakdown =
      document.querySelector(
        ".resultsBreakdown"
      );

    breakdown.insertAdjacentElement(
      "beforebegin",
      comparison
    );
  }

  if (!isComputerGame()) {
    comparison.style.display = "none";
    return;
  }

  const humanScore =
    Number(totalScoreElement.textContent);

  const computerScore =
    scoreComputerSheet(computerSheet);

  let outcome = "Tie Game";

  if (humanScore > computerScore) {
    outcome = "You Win!";
  } else if (computerScore > humanScore) {
    outcome = "Computer Wins";
  }

  comparison.style.display = "block";

  comparison.innerHTML = `
    <strong style="
      display:block;
      color:#dcc2ff;
      font-size:16px;
      margin-bottom:5px;
    ">
      ${outcome}
    </strong>

    <span style="
      color:#ffffff;
      font-size:13px;
      font-weight:800;
    ">
      You: ${humanScore}
      &nbsp;•&nbsp;
      Computer: ${computerScore}
    </span>
  `;
};


/*
  Reset all private computer information.
*/

function resetComputerSheet() {
  computerSheet =
    createFreshComputerSheet();

  computerSecretColoredDice = null;
  pendingComputerWhiteChoice = null;
}


const hiddenComputerClearEntireScoreSheet =
  clearEntireScoreSheet;

clearEntireScoreSheet = function () {
  resetComputerSheet();
  hiddenComputerClearEntireScoreSheet();
};


computerModeButton.addEventListener(
  "click",
  function () {
    resetComputerSheet();
    updateGameState();
  }
);


virtualModeButton.addEventListener(
  "click",
  function () {
    pendingComputerWhiteChoice = null;
  }
);


physicalModeButton.addEventListener(
  "click",
  function () {
    pendingComputerWhiteChoice = null;
  }
);
/* =========================================
   FINAL SCORE-SHEET VIEWER
   ========================================= */

/*
  Record the exact numbers crossed by the
  computer, not only its score and position.
*/

const viewerOriginalCreateSheet =
  createFreshComputerSheet;

createFreshComputerSheet = function () {
  const sheet =
    viewerOriginalCreateSheet();

  computerRowOrder.forEach(function (color) {
    sheet.rows[color].crossedNumbers = [];
  });

  return sheet;
};


const viewerOriginalCopySheet =
  copyComputerSheet;

copyComputerSheet = function (sheet) {
  const copy =
    viewerOriginalCopySheet(sheet);

  computerRowOrder.forEach(function (color) {
    copy.rows[color].crossedNumbers =
      Array.isArray(
        sheet.rows[color].crossedNumbers
      )
        ? [...sheet.rows[color].crossedNumbers]
        : [];
  });

  return copy;
};


const viewerOriginalApplyCross =
  applyComputerCrossToSheet;

applyComputerCrossToSheet = function (
  sheet,
  color,
  number
) {
  const crossWasAdded =
    viewerOriginalApplyCross(
      sheet,
      color,
      number
    );

  if (!crossWasAdded) {
    return false;
  }

  if (
    !Array.isArray(
      sheet.rows[color].crossedNumbers
    )
  ) {
    sheet.rows[color].crossedNumbers = [];
  }

  sheet.rows[color].crossedNumbers.push(
    number
  );

  return true;
};


/* VIEW SCORE SHEETS BUTTON */

const viewScoreSheetsButton =
  document.createElement("button");

viewScoreSheetsButton.id =
  "viewScoreSheetsButton";

viewScoreSheetsButton.type = "button";

viewScoreSheetsButton.textContent =
  "View Score Sheets";

viewScoreSheetsButton.style.display =
  "none";

const finalResultsActions =
  document.querySelector(".resultsActions");

finalResultsActions.insertAdjacentElement(
  "beforebegin",
  viewScoreSheetsButton
);


/* FULL-SCREEN VIEWER */

const scoreSheetViewerOverlay =
  document.createElement("div");

scoreSheetViewerOverlay.id =
  "scoreSheetViewerOverlay";

scoreSheetViewerOverlay.setAttribute(
  "aria-hidden",
  "true"
);

scoreSheetViewerOverlay.innerHTML = `
  <section
    class="scoreSheetViewerCard"
    role="dialog"
    aria-modal="true"
    aria-labelledby="scoreSheetViewerTitle"
  >
    <div class="scoreSheetViewerHeader">
      <div>
        <small>GAME COMPLETE</small>

        <h2 id="scoreSheetViewerTitle">
          Score Sheets
        </h2>
      </div>

      <button
        id="closeScoreSheetViewerButton"
        type="button"
      >
        Back
      </button>
    </div>

    <div class="scoreSheetTabs">
      <button
        id="viewHumanSheetButton"
        class="active"
        type="button"
      >
        Your Sheet
      </button>

      <button
        id="viewComputerSheetButton"
        type="button"
      >
        Computer Sheet
      </button>
    </div>

    <div id="finalScoreSheetContainer"></div>
  </section>
`;

document.body.appendChild(
  scoreSheetViewerOverlay
);

const closeScoreSheetViewerButton =
  document.getElementById(
    "closeScoreSheetViewerButton"
  );

const viewHumanSheetButton =
  document.getElementById(
    "viewHumanSheetButton"
  );

const viewComputerSheetButton =
  document.getElementById(
    "viewComputerSheetButton"
  );

const finalScoreSheetContainer =
  document.getElementById(
    "finalScoreSheetContainer"
  );


/* VIEWER STYLING */

const scoreSheetViewerStyles =
  document.createElement("style");

scoreSheetViewerStyles.textContent = `
  #viewScoreSheetsButton {
    width: 100%;
    min-height: 43px;
    margin: 9px 0 4px;
    padding: 8px 12px;

    color: #ffffff;
    border: 1px solid rgba(220, 194, 255, 0.42);
    border-radius: 12px;

    background:
      linear-gradient(
        135deg,
        rgba(110, 69, 174, 0.96),
        rgba(55, 37, 98, 0.96)
      );

    font: inherit;
    font-size: 13px;
    font-weight: 900;
  }

  #viewScoreSheetsButton:active {
    transform: scale(0.98);
  }

  #scoreSheetViewerOverlay {
    position: fixed;
    z-index: 5000;
    inset: 0;

    display: none;
    align-items: center;
    justify-content: center;

    padding:
      max(8px, env(safe-area-inset-top))
      max(8px, env(safe-area-inset-right))
      max(8px, env(safe-area-inset-bottom))
      max(8px, env(safe-area-inset-left));

    background: rgba(4, 10, 18, 0.94);
  }

  #scoreSheetViewerOverlay.open {
    display: flex;
  }

  .scoreSheetViewerCard {
    width: 100%;
    max-width: 700px;
    max-height: 96dvh;
    overflow-y: auto;

    padding: 10px;

    border: 1px solid rgba(220, 194, 255, 0.34);
    border-radius: 17px;

    background:
      linear-gradient(
        160deg,
        #152a3e,
        #091522
      );

    box-shadow:
      0 18px 45px rgba(0, 0, 0, 0.55);
  }

  .scoreSheetViewerHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;

    margin-bottom: 8px;
  }

  .scoreSheetViewerHeader small {
    color: #aab7c5;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 1.5px;
  }

  .scoreSheetViewerHeader h2 {
    margin: 1px 0 0;
    color: #ffffff;
    font-size: 18px;
  }

  #closeScoreSheetViewerButton {
    min-width: 68px;
    min-height: 36px;

    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 10px;
    background: rgba(255,255,255,0.08);

    font: inherit;
    font-size: 11px;
    font-weight: 850;
  }

  .scoreSheetTabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;

    margin-bottom: 8px;
    padding: 4px;

    border-radius: 12px;
    background: rgba(0,0,0,0.2);
  }

  .scoreSheetTabs button {
    min-height: 37px;

    color: #aab7c5;
    border: 0;
    border-radius: 9px;
    background: transparent;

    font: inherit;
    font-size: 11px;
    font-weight: 900;
  }

  .scoreSheetTabs button.active {
    color: #ffffff;

    background:
      linear-gradient(
        135deg,
        rgba(110,69,174,0.96),
        rgba(55,37,98,0.96)
      );
  }

  #finalScoreSheetContainer .scoreCard {
    width: 100%;
    margin: 0;
  }

  #finalScoreSheetContainer button {
    pointer-events: none;
  }

  @media (max-height: 700px) {
    .scoreSheetViewerCard {
      padding: 7px;
    }

    .scoreSheetViewerHeader {
      margin-bottom: 5px;
    }

    .scoreSheetTabs {
      margin-bottom: 5px;
    }
  }
`;

document.head.appendChild(
  scoreSheetViewerStyles
);


/* PREPARE A NON-PLAYABLE SHEET COPY */

function prepareFinalSheetClone() {
  const clone =
    document.querySelector(".scoreCard")
      .cloneNode(true);

  clone.querySelectorAll("[id]")
    .forEach(function (element) {
      element.removeAttribute("id");
    });

  clone.querySelectorAll("button")
    .forEach(function (button) {
      button.disabled = true;
    });

  return clone;
}


function displayFinalSheetClone(clone) {
  finalScoreSheetContainer.innerHTML = "";

  finalScoreSheetContainer.appendChild(
    clone
  );
}


/* DISPLAY THE PLAYER'S SHEET */

function showFinalHumanSheet() {
  const clone = prepareFinalSheetClone();

  const headingRight =
    clone.querySelector(
      ".scoreHeading span:last-child"
    );

  headingRight.innerHTML =
    `You · <strong>${totalScoreElement.textContent}</strong> pts`;

  displayFinalSheetClone(clone);

  viewHumanSheetButton.classList.add(
    "active"
  );

  viewComputerSheetButton.classList.remove(
    "active"
  );
}


/* DISPLAY THE COMPUTER'S HIDDEN SHEET */

function showFinalComputerSheet() {
  const clone = prepareFinalSheetClone();

  const clonedRows = Array.from(
    clone.querySelectorAll(".scoreRow")
  );

  clonedRows.forEach(function (
    row,
    index
  ) {
    const color =
      computerRowOrder[index];

    const computerRow =
      computerSheet.rows[color];

    const crossedNumbers =
      Array.isArray(
        computerRow.crossedNumbers
      )
        ? computerRow.crossedNumbers
        : [];

    const buttons = Array.from(
      row.querySelectorAll(
        ".numberTrack button"
      )
    );

    buttons.forEach(function (button) {
      button.classList.remove(
        "crossed",
        "confirmed",
        "unavailable",
        "preview-unavailable",
        "final-restricted"
      );

      const number =
        Number(button.textContent.trim());

      if (crossedNumbers.includes(number)) {
        button.classList.add(
          "crossed",
          "confirmed"
        );
      } else if (
        colorIsLockedForEveryone(color)
      ) {
        button.classList.add(
          "unavailable"
        );
      }
    });

    const lockButton =
      row.querySelector(".lockBox");

    lockButton.classList.remove(
      "pending-lock",
      "confirmed-lock",
      "unavailable-lock"
    );

    if (computerRow.locked) {
      row.classList.add("locked-row");

      lockButton.classList.add(
        "confirmed-lock"
      );
    } else {
      row.classList.remove("locked-row");

      lockButton.classList.add(
        "unavailable-lock"
      );
    }

    const scoringCrosses =
      computerRow.crossCount +
      (computerRow.locked ? 1 : 0);

    const rowScore =
      row.querySelector(".rowScore");

    if (rowScore) {
      rowScore.textContent =
        calculatePoints(scoringCrosses);

      rowScore.classList.remove(
        "preview-score"
      );
    }
  });

  const clonedPenaltyButtons =
    Array.from(
      clone.querySelectorAll(
        ".penaltyBoxes button"
      )
    );

  clonedPenaltyButtons.forEach(
    function (button, index) {
      button.classList.remove(
        "pending-penalty",
        "confirmed-penalty"
      );

      if (
        index < computerSheet.penalties
      ) {
        button.classList.add(
          "confirmed-penalty"
        );
      }
    }
  );

  const clonedPenaltyValue =
    clone.querySelector(
      ".penaltyValue strong"
    );

  if (clonedPenaltyValue) {
    clonedPenaltyValue.textContent =
      computerSheet.penalties * -5;
  }

  const computerTotal =
    scoreComputerSheet(computerSheet);

  const headingRight =
    clone.querySelector(
      ".scoreHeading span:last-child"
    );

  headingRight.innerHTML =
    `Computer · <strong>${computerTotal}</strong> pts`;

  displayFinalSheetClone(clone);

  viewComputerSheetButton.classList.add(
    "active"
  );

  viewHumanSheetButton.classList.remove(
    "active"
  );
}


/* OPEN AND CLOSE THE VIEWER */

function openFinalScoreSheetViewer() {
  if (!isComputerGame() || !gameIsOver) {
    return;
  }

  resultsOverlay.classList.remove("open");

  resultsOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

  showFinalHumanSheet();

  scoreSheetViewerOverlay.classList.add(
    "open"
  );

  scoreSheetViewerOverlay.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeFinalScoreSheetViewer() {
  scoreSheetViewerOverlay.classList.remove(
    "open"
  );

  scoreSheetViewerOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

  if (gameIsOver) {
    resultsOverlay.classList.add("open");

    resultsOverlay.setAttribute(
      "aria-hidden",
      "false"
    );
  }
}


/* BUTTON ACTIONS */

viewScoreSheetsButton.addEventListener(
  "click",
  openFinalScoreSheetViewer
);

closeScoreSheetViewerButton.addEventListener(
  "click",
  closeFinalScoreSheetViewer
);

viewHumanSheetButton.addEventListener(
  "click",
  showFinalHumanSheet
);

viewComputerSheetButton.addEventListener(
  "click",
  showFinalComputerSheet
);


/*
  Show the viewer button only after a
  computer game.
*/

const viewerOriginalOpenResults =
  openResultsPanel;

openResultsPanel = function (reason) {
  viewerOriginalOpenResults(reason);

  viewScoreSheetsButton.style.display =
    isComputerGame()
      ? "block"
      : "none";
};


/*
  Close the viewer when a new game begins or
  the player returns to the menu.
*/

const viewerOriginalCloseResults =
  closeResultsPanel;

closeResultsPanel = function () {
  scoreSheetViewerOverlay.classList.remove(
    "open"
  );

  scoreSheetViewerOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

  viewerOriginalCloseResults();
};