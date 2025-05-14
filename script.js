const suits = [
  { symbol: "♠", name: "spades", color: "black" },
  { symbol: "♥", name: "hearts", color: "red" },
  { symbol: "♦", name: "diamonds", color: "red" },
  { symbol: "♣", name: "clubs", color: "black" }
];

const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const handSize = 3;
let deck = [];

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

function playSound() {
  const audio = document.getElementById("dice");
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(err => console.error("Playback error:", err));
  }
}

function dealHand() {
  createDeck();

  const hand = deck.slice(0, handSize);
  const opponent = deck.slice(handSize, handSize * 2);
  const remainingDeck = deck.slice(handSize * 2);

  const redRanks = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  let middleCard = null;
  let firstPlayer = null;

  for (let rank of redRanks) {
    let i = hand.findIndex(card => card.rank === rank && card.suit.color === "red");
    if (i !== -1) {
      middleCard = hand.splice(i, 1)[0];
      firstPlayer = "Opponent";
      break;
    }
    let j = opponent.findIndex(card => card.rank === rank && card.suit.color === "red");
    if (j !== -1) {
      middleCard = opponent.splice(j, 1)[0];
      firstPlayer = "You";
      break;
    }
  }

  if (!middleCard) {
    const blackThreeIndex = deck.findIndex(card => card.rank === "3" && card.suit.color === "black");
    if (blackThreeIndex !== -1) {
      deck = [...deck.slice(blackThreeIndex), ...deck.slice(0, blackThreeIndex)];
    }
    dealHand();
    return;
  }

  document.getElementById("first-player").textContent = `${firstPlayer} go${firstPlayer === "You" ? "" : "es"} first!`;

  const handContainer = document.getElementById("poker-hand");
  handContainer.innerHTML = "";
  hand.forEach((card, index) => {
    const cardDiv = document.createElement("div");
    cardDiv.className = `card ${card.suit.color === "red" ? "red" : ""}`;
    cardDiv.innerHTML = `
      <div class="corner top-left">${card.rank}${card.suit.symbol}</div>
      <div class="suit">${card.suit.symbol}</div>
      <div class="corner bottom-right">${card.rank}${card.suit.symbol}</div>
    `;
    handContainer.appendChild(cardDiv);
    setTimeout(() => cardDiv.classList.add("revealed"), index * 100);
  });

  const opponentContainer = document.getElementById("opponent-hand");
  opponentContainer.innerHTML = "";
  opponent.forEach((_, index) => {
    setTimeout(() => {
      const back = document.createElement("div");
      back.className = "card-back revealed";
      opponentContainer.appendChild(back);
    }, index * 100);
  });

  const middlePile = document.getElementById("middle-pile");
  middlePile.innerHTML = "";
  if (middleCard) {
    const cardDiv = document.createElement("div");
    cardDiv.className = `card ${middleCard.suit.color === "red" ? "red revealed" : "revealed"}`;
    cardDiv.innerHTML = `
      <div class="corner top-left">${middleCard.rank}${middleCard.suit.symbol}</div>
      <div class="suit">${middleCard.suit.symbol}</div>
      <div class="corner bottom-right">${middleCard.rank}${middleCard.suit.symbol}</div>
    `;
    middlePile.appendChild(cardDiv);
  }

  updateDeckVisual(remainingDeck);
}

function drawCard() {
  // Check if the deck is empty
  if (deck.length === 0) {
    console.log("No more cards in the deck.");
    return;
  }

  // Get the player's hand container and check how many cards are in it
  const handContainer = document.getElementById("poker-hand");
  const currentHandSize = handContainer.children.length;

  // Don't allow drawing more than 3 cards
  if (currentHandSize >= 3) {
    console.log("You already have 3 cards. Cannot draw more.");
    return;
  }

  // Draw the top card from the deck
  const card = deck.shift(); // Remove from the deck
  console.log("Card drawn:", card);

  // Create the card div
  const cardDiv = document.createElement("div");
  cardDiv.className = `card ${card.suit.color === "red" ? "red" : ""}`;
  cardDiv.innerHTML = `
    <div class="corner top-left">${card.rank}${card.suit.symbol}</div>
    <div class="suit">${card.suit.symbol}</div>
    <div class="corner bottom-right">${card.rank}${card.suit.symbol}</div>
  `;

  // Add the drawn card to the player's hand
  handContainer.appendChild(cardDiv);
  setTimeout(() => cardDiv.classList.add("revealed"), 100);

  // Update the deck display
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

  // Mark the top card for hover effect
  const backs = deckContainer.querySelectorAll(".card-back");
  if (backs.length > 0) {
    backs[backs.length - 1].classList.add("top-card");
  }

  // Reveal the deck
  setTimeout(() => {
    deckContainer.classList.add("revealed");
  }, 200);
}