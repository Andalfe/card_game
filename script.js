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

  for (let rank of redRanks) {
    let i = playerHand.findIndex(card => card.rank === rank && card.suit.color === "red");
    if (i !== -1) {
      middlePile = [playerHand.splice(i, 1)[0]];
      firstPlayer = "Opponent";
      break;
    }
    let j = opponentHand.findIndex(card => card.rank === rank && card.suit.color === "red");
    if (j !== -1) {
      middlePile = [opponentHand.splice(j, 1)[0]];
      firstPlayer = "Player";
      needsInitialDraw = true;
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
    if (currentTurn !== "Player" || !selectedCard || middlePile.length === 0) return;

    const selectedRankVal = rankValue(selectedCard.card.rank);
    const middleRankVal = rankValue(middlePile[middlePile.length - 1].rank);

    if (selectedRankVal >= middleRankVal) {
      middlePile.push(selectedCard.card);
      selectedCard.element.remove();
      playerHand = playerHand.filter(c => c !== selectedCard.card);
      renderHand(playerHand);
      selectedCard = null;
      renderMiddlePile();

      if (playerHand.length < 3 && deck.length > 0) {
        // Don't change turn yet — player must manually draw
      } else {
        currentTurn = "Opponent";
        document.getElementById("first-player").textContent = "Opponent goes next!";
        setTimeout(opponentPlay, 800);
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
      
      currentTurn = "Opponent";
      document.getElementById("first-player").textContent = "Opponent goes next!";
      setTimeout(opponentPlay, 800);
    }
  };
}

function opponentPlay() {
  const topCard = middlePile[middlePile.length - 1];
  const topVal = rankValue(topCard.rank);

  // Find all playable cards
  const playable = opponentHand.filter(card => rankValue(card.rank) > topVal);

  if (playable.length > 0) {
    // Play the smallest valid card
    playable.sort((a, b) => rankValue(a.rank) - rankValue(b.rank));
    const chosen = playable[0];

    opponentHand = opponentHand.filter(c => c !== chosen);
    middlePile.push(chosen);

    renderOpponentHand();
    renderMiddlePile();

    // Draw to maintain hand size
    if (opponentHand.length < 3 && deck.length > 0) {
      const newCard = deck.shift();
      opponentHand.push(newCard);
      renderOpponentHand();
      updateDeckVisual(deck);
    }
  } else {
    // Opponent can't play - pick up the middle pile
    opponentHand.push(...middlePile);
    middlePile = [];
    renderOpponentHand();
    renderMiddlePile();

    // Draw to maintain hand size
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
  if (currentTurn === "Player" && playerHand.length < 3 && deck.length > 0) {
    const card = deck.shift();
    playerHand.push(card);
    renderHand(playerHand);
    updateDeckVisual(deck);
    renderMiddlePile();

    if (needsInitialDraw || playerHand.length === 3) {
      needsInitialDraw = false;
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