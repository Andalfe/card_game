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
      deck.push({
        rank: rank,
        suit: suit
      });
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
    audio.play().catch(err => {
      console.error("Playback error:", err);
    });
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
      firstPlayer = "You";
      break;
    }
    let j = opponent.findIndex(card => card.rank === rank && card.suit.color === "red");
    if (j !== -1) {
      middleCard = opponent.splice(j, 1)[0];
      firstPlayer = "Opponent";
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

  // Render who goes first
  const firstPlayerContainer = document.getElementById("first-player");
  if (firstPlayerContainer) {
    firstPlayerContainer.textContent = `${firstPlayer} go${firstPlayer === "You" ? "" : "es"} first!`;
  }

  // Render player hand
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

  // Render opponent hand one by one
  const opponentContainer = document.getElementById("opponent-hand");
  opponentContainer.innerHTML = "";
  opponent.forEach((_, index) => {
    setTimeout(() => {
      const back = document.createElement("div");
      back.className = "card-back revealed"; // Add 'revealed' for animation if needed
      opponentContainer.appendChild(back);
    }, index * 100); // Same delay as player cards
  });

  // Render middle pile
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
  } else {
    middlePile.innerHTML = `<div style="color:white;">No red card found</div>`;
  }

  // Render remaining deck
  const deckContainer = document.getElementById("deck");
  deckContainer.innerHTML = ""; // Clear out any existing cards

  const horizontalOffset = -0.1; // Extremely small horizontal offset for a slight stack

  remainingDeck.forEach((_, i) => {
    const back = document.createElement("div");
    back.className = "card-back";

    const xOffset = i * horizontalOffset;
    const yOffset = 0.5 // Absolutely no vertical offset

    back.style.transform = `translateX(${xOffset}px) translateY(${yOffset}px)`;

    deckContainer.appendChild(back);
  });




  setTimeout(() => {
    deckContainer.classList.add("revealed");
  }, 200);
}