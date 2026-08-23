"use strict";

/* =========================================
   DICE BENDER
   Rows, penalties, locks, and scoring
   ========================================= */


/* SCREEN ELEMENTS */

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");


/* START SCREEN BUTTONS */

const virtualModeButton = document.getElementById("virtualModeButton");
const physicalModeButton = document.getElementById("physicalModeButton");
const howToPlayButton = document.getElementById("howToPlayButton");


/* GAME SCREEN ELEMENTS */

const backButton = document.getElementById("backButton");
const menuButton = document.getElementById("menuButton");
const mainActionButton = document.getElementById("mainActionButton");
const newGameButton = document.getElementById("newGameButton");
const modeLabel = document.getElementById("modeLabel");

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

const lockOverlay = document.getElementById("lockOverlay");
const cancelLockButton = document.getElementById("cancelLockButton");
const confirmLockButton = document.getElementById("confirmLockButton");
const lockCard = document.querySelector(".lockCard");


/* CURRENT GAME INFORMATION */

let currentMode = null;
let pendingSelections = [];
let pendingPenalty = null;


/* SCORE DISPLAY ELEMENTS */

let totalScoreElement = null;
let penaltyScoreElement = null;

const rowScoreElements = new Map();


/* =========================================
   CREATE SCORE DISPLAYS
   ========================================= */

function createScoreDisplays() {
  /*
    Add a small score underneath each elemental icon.
  */

  scoreRows.forEach(function (row) {
    const rowElement = row.querySelector(".rowElement");

    const scoreElement = document.createElement("strong");

    scoreElement.className = "rowScore";
    scoreElement.textContent = "0";

    rowElement.appendChild(scoreElement);
    rowScoreElements.set(row, scoreElement);
  });


  /*
    Replace the Player 1 label with a running total.
  */

  const scoreHeadingRight =
    document.querySelector(".scoreHeading span:last-child");

  scoreHeadingRight.innerHTML =
    `Player 1 · <strong id="totalScore">0</strong> pts`;

  totalScoreElement =
    document.getElementById("totalScore");


  /*
    Turn the penalty label into a running penalty total.
  */

  const penaltyValue =
    document.querySelector(".penaltyValue");

  penaltyValue.innerHTML =
    `<strong id="penaltyScore">0</strong> pts`;

  penaltyScoreElement =
    document.getElementById("penaltyScore");
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

  if (mode === "virtual") {
    modeLabel.textContent = "Virtual Dice";
  } else {
    modeLabel.textContent = "Physical Dice";
  }

  mainActionButton.textContent = "Lock In Selections";

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
  const rowButtons = getRowButtons(row);

  return rowButtons
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
    const finalButton = getFinalNumberButton(row);

    const isTemporarilySelected =
      pendingSelections.includes(finalButton);

    const crossedBeforeFinal =
      getCrossedCountBeforeFinal(row);

    if (
      isTemporarilySelected &&
      crossedBeforeFinal < 5
    ) {
      finalButton.classList.remove("crossed");
      finalButton.setAttribute("aria-pressed", "false");

      pendingSelections = pendingSelections.filter(
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
    const finalButton = getFinalNumberButton(row);
    const lockButton = row.querySelector(".lockBox");

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
        button.disabled = isConfirmed;
        return;
      }


      if (finalIsConfirmed) {
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
        button.classList.add("preview-unavailable");
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
    return !button.classList.contains("confirmed-penalty");
  });
}


function updatePenaltyState() {
  const nextPenaltyButton = getNextPenaltyButton();

  penaltyButtons.forEach(function (button) {
    const isConfirmed = button.classList.contains(
      "confirmed-penalty"
    );

    const isPending = button === pendingPenalty;

    if (isConfirmed) {
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
   SCORE CALCULATION
   ========================================= */

function calculatePoints(crossCount) {
  /*
    This creates the standard scoring sequence:
    1, 3, 6, 10, 15, 21, and so forth.
  */

  return crossCount * (crossCount + 1) / 2;
}


function updateScores() {
  let totalScore = 0;
  let hasTemporaryScore = false;


  scoreRows.forEach(function (row) {
    const rowButtons = getRowButtons(row);
    const finalButton = getFinalNumberButton(row);

    const numberCrosses =
      rowButtons.filter(function (button) {
        return button.classList.contains("crossed");
      }).length;

    const hasLockCross =
      finalButton.classList.contains("crossed");

    const totalRowCrosses =
      numberCrosses + (hasLockCross ? 1 : 0);

    const rowPoints =
      calculatePoints(totalRowCrosses);

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

  mainActionButton.disabled = !hasPendingChoice;
}


/* =========================================
   TEMPORARY NUMBER SELECTIONS
   ========================================= */

function selectNumber(button) {
  if (button.classList.contains("confirmed")) {
    return;
  }


  if (pendingSelections.includes(button)) {
    button.classList.remove("crossed");
    button.setAttribute("aria-pressed", "false");

    pendingSelections = pendingSelections.filter(
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
  button.setAttribute("aria-pressed", "true");

  pendingSelections.push(button);

  updateGameState();
}


/* =========================================
   TEMPORARY PENALTY
   ========================================= */

function selectPenalty(button) {
  if (button === pendingPenalty) {
    button.classList.remove("pending-penalty");
    button.setAttribute("aria-pressed", "false");

    pendingPenalty = null;

    updateGameState();
    return;
  }


  if (pendingSelections.length > 0) {
    return;
  }


  if (button.classList.contains("confirmed-penalty")) {
    return;
  }


  if (button !== getNextPenaltyButton()) {
    return;
  }


  pendingPenalty = button;

  button.classList.add("pending-penalty");
  button.setAttribute("aria-pressed", "true");

  updateGameState();
}


/* =========================================
   COMPACT LOCK CONFIRMATION
   ========================================= */

function positionLockPanel() {
  const buttonPosition =
    mainActionButton.getBoundingClientRect();

  const panelGap = 5;
  const expectedPanelHeight = 53;

  let panelTop =
    buttonPosition.bottom + panelGap;

  if (
    panelTop + expectedPanelHeight >
    window.innerHeight - 6
  ) {
    panelTop =
      buttonPosition.top -
      expectedPanelHeight -
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

  if (!hasPendingChoice) {
    return;
  }

  lockOverlay.classList.add("open");
  lockOverlay.setAttribute("aria-hidden", "false");

  positionLockPanel();
  confirmLockButton.focus();
}


function closeLockPanel() {
  lockOverlay.classList.remove("open");
  lockOverlay.setAttribute("aria-hidden", "true");
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
    pendingPenalty.classList.remove("pending-penalty");
    pendingPenalty.classList.add("confirmed-penalty");
    pendingPenalty.disabled = true;

    pendingPenalty = null;
  }


  closeLockPanel();
  updateGameState();
}


/* =========================================
   CLEARING TEMPORARY CHOICES
   ========================================= */

function clearPendingChoices() {
  pendingSelections.forEach(function (button) {
    button.classList.remove("crossed");
    button.setAttribute("aria-pressed", "false");
  });

  pendingSelections = [];


  if (pendingPenalty !== null) {
    pendingPenalty.classList.remove("pending-penalty");
    pendingPenalty.setAttribute("aria-pressed", "false");

    pendingPenalty = null;
  }


  closeLockPanel();
  updateGameState();
}


/* =========================================
   NEW GAME
   ========================================= */

function clearEntireScoreSheet() {
  numberButtons.forEach(function (button) {
    button.classList.remove("crossed");
    button.classList.remove("confirmed");
    button.classList.remove("unavailable");
    button.classList.remove("preview-unavailable");
    button.classList.remove("final-restricted");

    button.setAttribute("aria-pressed", "false");
    button.disabled = false;
  });


  penaltyButtons.forEach(function (button) {
    button.classList.remove("pending-penalty");
    button.classList.remove("confirmed-penalty");

    button.setAttribute("aria-pressed", "false");
    button.disabled = false;
  });


  lockButtons.forEach(function (button) {
    button.classList.remove("pending-lock");
    button.classList.remove("confirmed-lock");
    button.classList.remove("unavailable-lock");
  });


  scoreRows.forEach(function (row) {
    row.classList.remove("locked-row");
  });


  pendingSelections = [];
  pendingPenalty = null;

  closeLockPanel();
  updateGameState();
}


/* =========================================
   BUTTON ACTIONS
   ========================================= */

numberButtons.forEach(function (button) {
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("click", function () {
    selectNumber(button);
  });
});


penaltyButtons.forEach(function (button) {
  button.setAttribute("aria-pressed", "false");

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


document.addEventListener("keydown", function (event) {
  if (
    event.key === "Escape" &&
    lockOverlay.classList.contains("open")
  ) {
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


window.addEventListener("resize", function () {
  if (lockOverlay.classList.contains("open")) {
    positionLockPanel();
  }
});


/* =========================================
   INITIAL SETUP
   ========================================= */

createScoreDisplays();
updateGameState();
