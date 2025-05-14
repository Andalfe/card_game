const suits = [
  { symbol: "♠", name: "spades", color: "black" },
  { symbol: "♥", name: "hearts", color: "red" },
  { symbol: "♦", name: "diamonds", color: "red" },
  { symbol: "♣", name: "clubs", color: "black" }
];

const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const handSize = 3;
let deck = [];
let selectedCard = null;
let middlePile = [];
let currentTurn = "Player";
let opponentHand = [];
let playerHand = [];
let needsInitialDraw = false;
let initialCardPlayed = false;
let waitingForDraw = false; // New flag

function createDeck() {
  deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  shuffle(deck);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function rankValue(rank) {
  return ranks.indexOf(rank);
}

function dealHand() {
  createDeck();

  playerHand = deck.slice(0, handSize);
  opponentHand = deck.slice(handSize, handSize * 2);
  deck = deck.slice(handSize * 2);

  const redRanks = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  let firstPlayer = null;
  middlePile = [];
  needsInitialDraw = false;
  initialCardPlayed = false;
  waitingForDraw = false; // Initialize

  for (let rank of redRanks) {
    let i = playerHand.findIndex(card => card.rank === rank && card.suit.color === "red");
    if (i !== -1) {
      middlePile = [playerHand.splice(i, 1)[0]];
      firstPlayer = "Player";
      initialCardPlayed = true;
      break;
    }
    let j = opponentHand.findIndex(card => card.rank === rank && card.suit.color === "red");
    if (j !== -1) {
      middlePile = [opponentHand.splice(j, 1)[0]];
      firstPlayer = "Opponent";
      needsInitialDraw = true;
      initialCardPlayed = true;
      break;
    }
  }

  if (middlePile.length === 0) {
    dealHand();
    return;
  }

  currentTurn = firstPlayer;
  document.getElementById("first-player").textContent = `${firstPlayer} go${firstPlayer === "Player" ? "" : "es"} first!`;

  renderHand(playerHand);
  renderOpponentHand();
  renderMiddlePile();
  updateDeckVisual(deck);

  if (currentTurn === "Opponent") {
    if (opponentHand.length < 3 && deck.length > 0) {
      const card = deck.shift();
      opponentHand.push(card);
      renderOpponentHand();
      updateDeckVisual(deck);
    }
    setTimeout(opponentPlay, 600);
  }
}

function renderHand(cards) {
  const handContainer = document.getElementById("shead-hand");
  handContainer.innerHTML = "";
  cards.forEach((card, index) => {
    const cardDiv = createCardDiv(card);
    let clickCount = 0;
    let timer;

    cardDiv.addEventListener("click", () => {
      if (currentTurn !== "Player" || waitingForDraw) return; // Disable card clicks while waiting to draw
      document.querySelectorAll("#shead-hand .card").forEach(c => c.classList.remove("selected"));
      cardDiv.classList.add("selected");
      selectedCard = { card, element: cardDiv };

      clickCount++;
      if (clickCount === 1) {
        timer = setTimeout(() => {
          clickCount = 0; // Reset after a delay if not a double-click
        }, 300); // Adjust the delay for double-click as needed
      } else if (clickCount === 2) {
        clearTimeout(timer);
        clickCount = 0;
        handleDoubleClick(card, cardDiv);
      }
    });
    handContainer.appendChild(cardDiv);
    setTimeout(() => cardDiv.classList.add("revealed"), index * 100);
  });
}



let incorrectMoveSound = new Audio('sounds/fuck_up_pick_up.mp3'); // Create an Audio object


function handleDoubleClick(card, cardElement) {
  if (currentTurn === "Player" && !waitingForDraw) {
    const playCard = () => {
      middlePile.push(card);
      cardElement.remove();
      playerHand = playerHand.filter(c => c !== card);
      renderHand(playerHand);
      renderMiddlePile();
      selectedCard = null;
      if (playerHand.length < 3 && deck.length > 0) {
        waitingForDraw = true;
        document.getElementById("first-player").textContent = "Click the deck to draw.";
      } else {
        endPlayerTurn();
      }
    };

    if (middlePile.length === 0) {
      playCard(); // Any card can start an empty pile
    } else {
      const selectedRankVal = rankValue(card.rank);
      const middleRankVal = rankValue(middlePile[middlePile.length - 1].rank);

      if (selectedRankVal >= middleRankVal) {
        playCard(); // Valid play
      } else {
        // Invalid play - trigger sound and pick up the middle pile
        incorrectMoveSound.play(); // Play the sound
        playerHand.push(...middlePile);
        middlePile = [];
        renderHand(playerHand);
        renderMiddlePile();
        selectedCard = null;
        // Player might need to draw after picking up
        while (playerHand.length < 3 && deck.length > 0) {
          const newCard = deck.shift();
          playerHand.push(newCard);
          renderHand(playerHand);
          updateDeckVisual(deck);
        }
        endPlayerTurn(); // End the turn after picking up
      }
    }
  }
}



function renderOpponentHand() {
  const container = document.getElementById("opponent-hand");
  container.innerHTML = "";
  opponentHand.forEach(() => {
    const back = document.createElement("div");
    back.className = "card-back revealed";
    container.appendChild(back);
  });
}

function renderMiddlePile() {
  const middlePileDiv = document.getElementById("middle-pile");
  middlePileDiv.innerHTML = "";

  if (middlePile.length > 0) {
    const topCard = middlePile[middlePile.length - 1];
    const cardDiv = createCardDiv(topCard);
    middlePileDiv.appendChild(cardDiv);
  }

  middlePileDiv.onclick = () => {
    if (currentTurn !== "Player" || !selectedCard || middlePile.length === 0 || waitingForDraw) return;

    const selectedRankVal = rankValue(selectedCard.card.rank);
    const middleRankVal = rankValue(middlePile[middlePile.length - 1].rank);

    if (selectedRankVal >= middleRankVal) {
      middlePile.push(selectedCard.card);
      selectedCard.element.remove();
      playerHand = playerHand.filter(c => c !== selectedCard.card);
      renderHand(playerHand);
      selectedCard = null;
      renderMiddlePile();

      // After playing a card, check if we need to draw
      if (playerHand.length < 3 && deck.length > 0) {
        waitingForDraw = true;
        document.getElementById("first-player").textContent = "Click the deck to draw.";
      } else {
        endPlayerTurn();
      }
    } else {
      // Player can't play a higher card - pick up the middle pile
      playerHand.push(...middlePile);
      middlePile = [];
      renderHand(playerHand);
      renderMiddlePile();
      selectedCard = null;

      // Draw to maintain hand size if needed
      while (playerHand.length < 3 && deck.length > 0) {
        const newCard = deck.shift();
        playerHand.push(newCard);
        renderHand(playerHand);
        updateDeckVisual(deck);
      }

      endPlayerTurn();
    }
  };
}

function endPlayerTurn() {
  currentTurn = "Opponent";
  document.getElementById("first-player").textContent = "Opponent goes next!";
  initialCardPlayed = false;
  waitingForDraw = false; // Reset the flag
  setTimeout(opponentPlay, 800);
}

function opponentPlay() {
  // Draw at the start of the turn if hand is less than 3
  while (opponentHand.length < 3 && deck.length > 0) {
    const newCard = deck.shift();
    opponentHand.push(newCard);
    renderOpponentHand();
    updateDeckVisual(deck);
  }

  const topCard = middlePile.length > 0 ? middlePile[middlePile.length - 1] : null;
  let playMade = false;

  if (topCard) {
    const topVal = rankValue(topCard.rank);
    const playable = opponentHand.filter(card => rankValue(card.rank) > topVal);

    if (playable.length > 0) {
      // Play the smallest valid card
      playable.sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
      const chosen = playable[0];

      opponentHand = opponentHand.filter(c => c !== chosen);
      middlePile.push(chosen);
      playMade = true;

      renderOpponentHand();
      renderMiddlePile();
    }
  } else if (middlePile.length === 0 && currentTurn === "Opponent") {
    // If the middle pile is empty, play any card (this handles the case after the player picks up)
    if (opponentHand.length > 0) {
      const cardToPlay = opponentHand.shift(); // Play the first card
      middlePile.push(cardToPlay);
      renderOpponentHand();
      renderMiddlePile();
      playMade = true;
    }
  }

  if (!playMade && middlePile.length > 0) {
    // Opponent can't play - pick up the middle pile
    opponentHand.push(...middlePile);
    middlePile = [];
    renderOpponentHand();
    renderMiddlePile();
    playMade = true;

    // Draw after picking up to get back to 3 cards if possible
    while (opponentHand.length < 3 && deck.length > 0) {
      const newCard = deck.shift();
      opponentHand.push(newCard);
      renderOpponentHand();
      updateDeckVisual(deck);
    }
  }

  // Switch turns
  currentTurn = "Player";
  document.getElementById("first-player").textContent = "It's your turn!";
}

document.getElementById("deck").addEventListener("click", () => {
  if (currentTurn === "Player" && waitingForDraw && playerHand.length < 3 && deck.length > 0) {
    const card = deck.shift();
    playerHand.push(card);
    renderHand(playerHand);
    updateDeckVisual(deck);
    renderMiddlePile();
    waitingForDraw = false; // Reset the flag after drawing
    endPlayerTurn(); // Now end the turn
  } else if (currentTurn === "Player" && playerHand.length < 3 && deck.length > 0 && !waitingForDraw) {
    // Normal draw if not waiting after playing
    const card = deck.shift();
    playerHand.push(card);
    renderHand(playerHand);
    updateDeckVisual(deck);
    renderMiddlePile();
    endPlayerTurn();
  }
});

function updateDeckVisual(currentDeck) {
  const deckContainer = document.getElementById("deck");
  deckContainer.innerHTML = "";

  currentDeck.forEach((_, i) => {
    const back = document.createElement("div");
    back.className = "card-back";
    back.style.zIndex = i + 1;
    back.style.transform = `translateX(${-i * 0.5}px) translateY(${-i * 0.5}px)`;
    deckContainer.appendChild(back);
  });

  const backs = deckContainer.querySelectorAll(".card-back");
  if (backs.length > 0) {
    backs[backs.length - 1].classList.add("top-card");
  }

  setTimeout(() => {
    deckContainer.classList.add("revealed");
  }, 200);
}

function createCardDiv(card) {
  const div = document.createElement("div");
  div.className = `card revealed ${card.suit.color === "red" ? "red" : ""}`;
  div.innerHTML = `
    <div class="corner top-left">${card.rank}${card.suit.symbol}</div>
    <div class="suit">${card.suit.symbol}</div>
    <div class="corner bottom-right">${card.rank}${card.suit.symbol}</div>
  `;
  return div;
}

dealHand();