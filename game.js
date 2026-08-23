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
    `Player 1 · <strong id="totalScore">0</strong> pts`;

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
  mainActionButton.textContent =
    "Lock In Selections";

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

  const hasPendingChoice =
    pendingSelections.length > 0 ||
    pendingPenalty !== null;

  mainActionButton.disabled =
    !hasPendingChoice || gameIsOver;
}


/* =========================================
   NUMBER SELECTIONS
   ========================================= */

function selectNumber(button) {
  if (
    gameIsOver ||
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
  if (gameIsOver) {
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
  showGameScreen("virtual");
});


physicalModeButton.addEventListener("click", function () {
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


mainActionButton.addEventListener("click", function () {
  openLockPanel();
});


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
