"use strict";

/* =========================================
   DICE BENDER
   Legal rows and penalties
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


/* CURRENT GAME INFORMATION */

let currentMode = null;
let pendingSelections = [];
let pendingPenalty = null;


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


function getFurthestSelectedPosition(row) {
  const rowButtons = getRowButtons(row);
  let furthestPosition = -1;

  rowButtons.forEach(function (button, position) {
    if (
      button.classList.contains("crossed") &&
      position > furthestPosition
    ) {
      furthestPosition = position;
    }
  });

  return furthestPosition;
}


/* =========================================
   NUMBER AVAILABILITY
   ========================================= */

function updateNumberState() {
  scoreRows.forEach(function (row) {
    const rowButtons = getRowButtons(row);
    const furthestPosition = getFurthestSelectedPosition(row);

    rowButtons.forEach(function (button, position) {
      const isCrossed = button.classList.contains("crossed");
      const isConfirmed = button.classList.contains("confirmed");

      if (isCrossed) {
        button.classList.remove("unavailable");
        button.disabled = isConfirmed;
        return;
      }

      if (position <= furthestPosition) {
        button.classList.add("unavailable");
        button.disabled = true;
      } else {
        button.classList.remove("unavailable");
        button.disabled = false;
      }
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

    /*
      Only the next empty penalty box can be selected.
      Future penalty boxes silently ignore taps.
    */

    button.disabled = (
      button !== nextPenaltyButton &&
      !isPending
    );
  });
}


/* =========================================
   COMPLETE INTERFACE UPDATE
   ========================================= */

function updateGameState() {
  updateNumberState();
  updatePenaltyState();

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

  /*
    Tap an existing temporary number to remove it.
  */

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

  /*
    A penalty cannot be combined with number selections.
  */

  if (pendingPenalty !== null) {
    return;
  }

  if (button.classList.contains("unavailable")) {
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
   TEMPORARY PENALTY SELECTION
   ========================================= */

function selectPenalty(button) {
  /*
    Tap the temporary penalty again to remove it.
  */

  if (button === pendingPenalty) {
    button.classList.remove("pending-penalty");
    button.setAttribute("aria-pressed", "false");

    pendingPenalty = null;

    updateGameState();
    return;
  }

  /*
    A penalty cannot be combined with number selections.
  */

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
   LOCKING IN A TURN
   ========================================= */

function lockInSelections() {
  const hasPendingChoice =
    pendingSelections.length > 0 ||
    pendingPenalty !== null;

  if (!hasPendingChoice) {
    return;
  }

  const shouldLockSelections = window.confirm(
    "Are you sure? This cannot be undone."
  );

  if (!shouldLockSelections) {
    return;
  }

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

    button.setAttribute("aria-pressed", "false");
    button.disabled = false;
  });

  penaltyButtons.forEach(function (button) {
    button.classList.remove("pending-penalty");
    button.classList.remove("confirmed-penalty");

    button.setAttribute("aria-pressed", "false");
    button.disabled = false;
  });

  pendingSelections = [];
  pendingPenalty = null;

  updateGameState();
}


/* =========================================
   NUMBER-BUTTON ACTIONS
   ========================================= */

numberButtons.forEach(function (button) {
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("click", function () {
    selectNumber(button);
  });
});


/* =========================================
   PENALTY-BUTTON ACTIONS
   ========================================= */

penaltyButtons.forEach(function (button) {
  button.setAttribute("aria-pressed", "false");

  button.addEventListener("click", function () {
    selectPenalty(button);
  });
});


/* =========================================
   START SCREEN ACTIONS
   ========================================= */

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


/* =========================================
   GAME SCREEN ACTIONS
   ========================================= */

backButton.addEventListener("click", function () {
  showStartScreen();
});


menuButton.addEventListener("click", function () {
  window.alert(
    "The game menu will be added in a later development stage."
  );
});


mainActionButton.addEventListener("click", function () {
  lockInSelections();
});


newGameButton.addEventListener("click", function () {
  const shouldStartNewGame = window.confirm(
    "Start a new game? The entire score sheet will be cleared."
  );

  if (shouldStartNewGame) {
    clearEntireScoreSheet();
  }
});


/* Establish the initial interface state */

updateGameState();
