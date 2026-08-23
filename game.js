"use strict";

/* =========================================
   DICE BENDER
   Legal rows, penalties, and lock-in panel
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


/* LOCK-IN PANEL */

const lockOverlay = document.getElementById("lockOverlay");
const cancelLockButton = document.getElementById("cancelLockButton");
const confirmLockButton = document.getElementById("confirmLockButton");
const lockCard = document.querySelector(".lockCard");

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


/* =========================================
   NUMBER AVAILABILITY
   ========================================= */

function updateNumberState() {
  scoreRows.forEach(function (row) {
    const rowButtons = getRowButtons(row);

    const furthestConfirmedPosition =
      getFurthestPosition(row, "confirmed");

    const furthestSelectedPosition =
      getFurthestPosition(row, "crossed");

    rowButtons.forEach(function (button, position) {
      const isCrossed = button.classList.contains("crossed");
      const isConfirmed = button.classList.contains("confirmed");

      button.classList.remove("unavailable");
      button.classList.remove("preview-unavailable");

      /*
        Crossed numbers remain fully visible.
      */

      if (isCrossed) {
        button.disabled = isConfirmed;
        return;
      }

      /*
        Numbers skipped by a locked selection are
        permanently unavailable.
      */

      if (position <= furthestConfirmedPosition) {
        button.classList.add("unavailable");
        button.disabled = true;
        return;
      }

      /*
        Numbers skipped only by a temporary selection
        receive lighter shading.
      */

      if (position <= furthestSelectedPosition) {
        button.classList.add("preview-unavailable");
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
    Tap a temporary selection again to remove it.
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

  if (pendingPenalty !== null) {
    return;
  }

  if (
    button.classList.contains("unavailable") ||
    button.classList.contains("preview-unavailable")
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
   TEMPORARY PENALTY SELECTION
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
   CUSTOM LOCK-IN PANEL
   ========================================= */

function positionLockPanel() {
  const buttonPosition =
    mainActionButton.getBoundingClientRect();

  const panelGap = 5;
  const expectedPanelHeight = 53;

  let panelTop =
    buttonPosition.bottom + panelGap;

  /*
    If a very short screen does not have enough room below,
    place the confirmation directly above the button instead.
  */

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
   NEW GAME
   ========================================= */

function clearEntireScoreSheet() {
  numberButtons.forEach(function (button) {
    button.classList.remove("crossed");
    button.classList.remove("confirmed");
    button.classList.remove("unavailable");
    button.classList.remove("preview-unavailable");

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
  closeLockPanel();
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


/* Establish the initial interface state */

updateGameState();
window.addEventListener("resize", function () {
  if (lockOverlay.classList.contains("open")) {
    positionLockPanel();
  }
});
