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
let middleCard = null;
let currentTurn = "Player"; // Tracks turn
let opponentHand = [];
let playerHand = [];

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

  for (let rank of redRanks) {
    let i = playerHand.findIndex(card => card.rank === rank && card.suit.color === "red");
    if (i !== -1) {
      middleCard = playerHand.splice(i, 1)[0];
      firstPlayer = "Opponent";
      break;
    }
    let j = opponentHand.findIndex(card => card.rank === rank && card.suit.color === "red");
    if (j !== -1) {
      middleCard = opponentHand.splice(j, 1)[0];
      firstPlayer = "Player";
      break;
    }
  }

  if (!middleCard) {
    const blackThreeIndex = deck.findIndex(card => card.rank === "3" && card.suit.color === "black");
    if (blackThreeIndex !== -1) {
      deck = [...deck.slice(blackThreeIndex), ...deck.slice(0, blackThreeIndex)];
    }
    dealHand(); // restart
    return;
  }

  currentTurn = firstPlayer;

  document.getElementById("first-player").textContent = `${firstPlayer} go${firstPlayer === "Player" ? "" : "es"} first!`;

  renderHand(playerHand);
  renderOpponentHand();
  renderMiddlePile();
  updateDeckVisual(deck);

  if (currentTurn === "Opponent") {
    setTimeout(opponentPlay, 600);  // Start opponent's turn automatically after a delay
  }
}

function renderHand(cards) {
  const handContainer = document.getElementById("shead-hand");
  handContainer.innerHTML = "";
  cards.forEach((card, index) => {
    const cardDiv = createCardDiv(card);
    cardDiv.addEventListener("click", () => {
      if (currentTurn !== "Player") return;
      document.querySelectorAll("#shead-hand .card").forEach(c => c.classList.remove("selected"));
      cardDiv.classList.add("selected");
      selectedCard = { card, element: cardDiv };
    });
    handContainer.appendChild(cardDiv);
    setTimeout(() => cardDiv.classList.add("revealed"), index * 100);
  });
}

function renderOpponentHand() {
  const container = document.getElementById("opponent-hand");
  container.innerHTML = "";
  opponentHand.forEach((_, index) => {
    const back = document.createElement("div");
    back.className = "card-back revealed";
    container.appendChild(back);
  });
}

function renderMiddlePile() {
  const middlePile = document.getElementById("middle-pile");
  middlePile.innerHTML = "";
  if (middleCard) {
    const cardDiv = createCardDiv(middleCard);
    middlePile.appendChild(cardDiv);
  }

  middlePile.onclick = () => {
    if (currentTurn !== "Player" || !selectedCard || !middleCard) return;

    const selectedRankVal = rankValue(selectedCard.card.rank);
    const middleRankVal = rankValue(middleCard.rank);

    if (selectedRankVal >= middleRankVal) {
      middleCard = selectedCard.card;
      selectedCard.element.remove();
      playerHand = playerHand.filter(c => c !== middleCard);
      renderHand(playerHand);
      selectedCard = null;
      renderMiddlePile();

      // Player must pick up a card from the deck if they don't have 3 cards after playing.
      if (playerHand.length < 3 && deck.length > 0) {
        const drawn = deck.shift();
        playerHand.push(drawn);
        renderHand(playerHand);
        updateDeckVisual(deck);
      }

      // Change turn to opponent after player plays and picks up a card
      currentTurn = "Opponent";
      document.getElementById("first-player").textContent = "Opponent goes next!";
      setTimeout(opponentPlay, 800);
    } else {
      alert("That card is not higher than the middle card.");
    }
  };
}

function opponentPlay() {
  if (opponentHand.length < 3) {
    // Opponent can't play unless they have 3 cards, so wait until the player draws
    currentTurn = "Player";
    document.getElementById("first-player").textContent = "It's your turn!";
    return;
  }

  const middleVal = rankValue(middleCard.rank);
  const playable = opponentHand.filter(card => rankValue(card.rank) >= middleVal);

  if (playable.length > 0) {
    // Choose lowest higher card
    playable.sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
    const chosen = playable[0];

    opponentHand = opponentHand.filter(c => c !== chosen);
    middleCard = chosen;
    renderOpponentHand();
    renderMiddlePile();

    // Opponent picks a card from the deck automatically
    if (opponentHand.length < 3 && deck.length > 0) {
      const newCard = deck.shift();
      opponentHand.push(newCard);
      renderOpponentHand();
    }

    currentTurn = "Player";  // Change turn back to player
    document.getElementById("first-player").textContent = "It's your turn!";
  } else {
    // Opponent cannot play a higher card, so they pick up the pile
    opponentHand.push(middleCard); // Pick up the pile
    middleCard = null; // Reset the middle card
    renderOpponentHand();
    renderMiddlePile();

    // Opponent picks a card from the deck automatically
    if (opponentHand.length < 3 && deck.length > 0) {
      const newCard = deck.shift();
      opponentHand.push(newCard);
      renderOpponentHand();
    }

    currentTurn = "Player";  // Change turn back to player
    document.getElementById("first-player").textContent = "It's your turn!";
  }
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

// Allow player to manually pick up from deck
document.getElementById("deck").addEventListener("click", () => {
  if (currentTurn === "Player" && playerHand.length < 3 && deck.length > 0) {
    const card = deck.shift();
    playerHand.push(card);
    renderHand(playerHand);
    updateDeckVisual(deck);

    // ✅ Now opponent can take their turn
    if (playerHand.length >= 3) {
      currentTurn = "Opponent";
      document.getElementById("first-player").textContent = "Opponent goes next!";
      setTimeout(opponentPlay, 800);
    }
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
