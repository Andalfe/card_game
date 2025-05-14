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
    setTimeout(opponentPlay, 600);
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

    if (selectedRankVal > middleRankVal) {
      // ✅ Player lays a higher card, so it goes on top of the middle pile
      middleCard = selectedCard.card;
      selectedCard.element.remove(); // Remove the card from the player's hand
      selectedCard = null; // Reset selected card
      renderMiddlePile(); // Update the middle pile

      playerHand = playerHand.filter(c => c !== middleCard); // Remove the card from player's hand
      renderHand(playerHand);

      // If the middle pile is won by player, they take all cards
      if (middleCard) {
        playerHand.push(middleCard);
      }

      // Ensure the player picks up a card before opponent plays
      if (playerHand.length < 3 && deck.length > 0) {
        drawCard(); // Player draws a card
      }
      setTimeout(opponentPlay, 600);
    } else {
      alert("Card is not higher than middle card.");
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
  const playable = opponentHand.filter(card => rankValue(card.rank) > middleVal);

  if (playable.length > 0) {
    // Choose lowest higher card
    playable.sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
    const chosen = playable[0];

    opponentHand = opponentHand.filter(c => c !== chosen);
    middleCard = chosen;
    renderOpponentHand();
    renderMiddlePile();

    // Opponent picks a card from the deck
    if (deck.length > 0) {
      const newCard = deck.shift();
      opponentHand.push(newCard);
      renderOpponentHand();
    }

    currentTurn = "Player";
    document.getElementById("first-player").textContent = "It's your turn!";
  } else {
    // Opponent cannot play a higher card, so they pick up the pile
    opponentHand.push(middleCard); // Pick up the pile
    middleCard = null; // Reset the middle card
    renderOpponentHand();
    renderMiddlePile();

    // Opponent picks a card from the deck
    if (deck.length > 0) {
      const newCard = deck.shift();
      opponentHand.push(newCard);
      renderOpponentHand();
    }

    currentTurn = "Player";
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

function drawCard() {
  if (deck.length === 0) {
    console.log("No more cards.");
    return;
  }

  const handContainer = document.getElementById("shead-hand");
  if (handContainer.children.length >= 3) {
    console.log("Hand full.");
    return;
  }

  const card = deck.shift();
  const cardDiv = createCardDiv(card);
  cardDiv.addEventListener("click", () => {
    if (currentTurn !== "Player") return;
    document.querySelectorAll("#shead-hand .card").forEach(c => c.classList.remove("selected"));
    cardDiv.classList.add("selected");
    selectedCard = { card, element: cardDiv };
  });

  handContainer.appendChild(cardDiv);
  setTimeout(() => cardDiv.classList.add("revealed"), 100);
  updateDeckVisual(deck);
}

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
