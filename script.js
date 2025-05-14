const suits = [
  { symbol: "♠", name: "spades", color: "black" },
  { symbol: "♥", name: "hearts", color: "red" },
  { symbol: "♦", name: "diamonds", color: "red" },
  { symbol: "♣", name: "clubs", color: "black" }
];

const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const handSize = 3;
let deck = [];
let selectedCards = [];
let middlePile = [];
let currentTurn = "Player";
let opponentHand = [];
let playerHand = [];
let needsInitialDraw = false;
let initialCardPlayed = false;
let waitingForDraw = false;
let incorrectMoveSound = new Audio('sounds/fuck_up_pick_up.mp3');
let opponentInitialTurn = true;

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
  waitingForDraw = false;
  opponentInitialTurn = true;

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

  currentTurn = firstPlayer;
  document.getElementById("first-player").textContent = `${firstPlayer} go${firstPlayer === "Player" ? "" : "es"} first!`;

  renderHand(playerHand);
  renderOpponentHand();
  renderMiddlePile();
  updateDeckVisual(deck);

  if (currentTurn === "Opponent") {
    setTimeout(() => {
      if (opponentInitialTurn) {
        opponentInitialTurn = false;
        if (opponentHand.length < 3 && deck.length > 0) {
          opponentHand.push(deck.shift());
          renderOpponentHand();
          updateDeckVisual(deck);
        }
        currentTurn = "Player";
        document.getElementById("first-player").textContent = "It's your turn!";
      } else {
        opponentPlay();
      }
    }, 800);
  }
}

function renderHand(cards) {
  const handContainer = document.getElementById("shead-hand");
  handContainer.innerHTML = "";

  const sortedHand = [...cards].sort((a, b) => rankValue(a.rank) - rankValue(b.rank));

  sortedHand.forEach((card, index) => {
    const cardDiv = createCardDiv(card);
    let clickCount = 0;
    let timer;

    cardDiv.addEventListener("click", () => {
      if (currentTurn !== "Player" || waitingForDraw) return;

      clickCount++;
      if (clickCount === 1) {
        timer = setTimeout(() => {
          clickCount = 0;
          const isSelected = selectedCards.some(sel => sel.element === cardDiv);
          if (isSelected) {
            cardDiv.classList.remove("selected", "enlarged");
            selectedCards = selectedCards.filter(sel => sel.element !== cardDiv);
          } else if (selectedCards.length < 4) { // Allow selection up to 4 cards
            cardDiv.classList.add("selected", "enlarged");
            selectedCards.push({ card, element: cardDiv });
          } else {
            alert("You can select a maximum of four cards at a time.");
          }
        }, 300);
      } else if (clickCount === 2) {
        clearTimeout(timer);
        clickCount = 0;
        playSingleCardWithDoubleClick(card, cardDiv);
      }
    });

    handContainer.appendChild(cardDiv);
    setTimeout(() => cardDiv.classList.add("revealed"), index * 100);
  });
}

function canPlayCard(card) {
  if (middlePile.length === 0) {
    return true; // Can always play on an empty pile
  }
  const topCard = middlePile[middlePile.length - 1];
  return rankValue(card.rank) >= rankValue(topCard.rank);
}

function playSingleCardWithDoubleClick(card, cardElement) {
  if (currentTurn === "Player" && !waitingForDraw) {
    if (middlePile.length === 0 || canPlayCard(card)) {
      middlePile.push(card);
      playerHand = playerHand.filter(c => c !== card);
      cardElement.remove();
      renderHand(playerHand);
      renderMiddlePile();
      selectedCards = [];
      if (playerHand.length < 3 && deck.length > 0) {
        waitingForDraw = true;
        document.getElementById("first-player").textContent = "Click the deck to draw.";
      } else {
        endPlayerTurn();
      }
    } else {
      // Check if there's any higher card the player could have played
      const hasHigherCard = playerHand.some(c => rankValue(c.rank) > rankValue(middlePile[middlePile.length - 1].rank));
      if (hasHigherCard) {
        triggerPickup();
      } else {
        // If no higher card, allow the pickup without the sound
        playerHand.push(...middlePile);
        middlePile = [];
        renderHand(playerHand);
        renderMiddlePile();
        while (playerHand.length < 3 && deck.length > 0) {
          playerHand.push(deck.shift());
        }
        renderHand(playerHand);
        updateDeckVisual(deck);
        endPlayerTurn();
      }
    }
  }
}

function triggerPickup() {
  incorrectMoveSound.play();
  playerHand.push(...middlePile);
  middlePile = [];
  renderHand(playerHand);
  renderMiddlePile();
  while (playerHand.length < 3 && deck.length > 0) {
    playerHand.push(deck.shift());
  }
  renderHand(playerHand);
  updateDeckVisual(deck);
  endPlayerTurn();
}

function handlePlayOnMiddlePile() {
  if (currentTurn !== "Player" || waitingForDraw || selectedCards.length === 0) return;

  if (middlePile.length === 0) {
    // Playing on an empty pile: must select at least one card of the same rank
    const firstRank = selectedCards[0].card.rank;
    const allSameRank = selectedCards.every(sel => sel.card.rank === firstRank);

    if (allSameRank) {
      selectedCards.forEach(({ card, element }) => {
        middlePile.push(card);
        playerHand = playerHand.filter(c => c !== card);
        element.remove();
      });
      renderHand(playerHand);
      renderMiddlePile();
      selectedCards = [];
      if (playerHand.length < 3 && deck.length > 0) {
        waitingForDraw = true;
        document.getElementById("first-player").textContent = "Click the deck to draw.";
      } else {
        endPlayerTurn();
      }
    } else if (selectedCards.length > 0) {
      // Check if there's any higher card the player could have played
      const hasHigherCard = playerHand.some(c => rankValue(c.rank) > -1); // Always false on empty pile?
      if (hasHigherCard) {
        triggerPickup();
      } else {
        playerHand.push(...middlePile);
        middlePile = [];
        renderHand(playerHand);
        renderMiddlePile();
        while (playerHand.length < 3 && deck.length > 0) {
          playerHand.push(deck.shift());
        }
        renderHand(playerHand);
        updateDeckVisual(deck);
        endPlayerTurn();
      }
    }
  } else {
    // Playing on a non-empty middle pile
    const topCard = middlePile[middlePile.length - 1];
    const topRankVal = rankValue(topCard.rank);

    const firstSelectedRank = selectedCards[0].card.rank;
    const allSameRankSelected = selectedCards.every(sel => sel.card.rank === firstSelectedRank);

    if (allSameRankSelected) {
      const firstSelectedRankVal = rankValue(firstSelectedRank);
      if (firstSelectedRankVal >= topRankVal) {
        selectedCards.forEach(({ card, element }) => {
          middlePile.push(card);
          playerHand = playerHand.filter(c => c !== card);
          element.remove();
        });
        renderHand(playerHand);
        renderMiddlePile();
        selectedCards = [];
        if (playerHand.length < 3 && deck.length > 0) {
          waitingForDraw = true;
          document.getElementById("first-player").textContent = `Click the deck to draw ${3 - playerHand.length} card(s).`;
        } else {
          endPlayerTurn();
        }
      } else {
        // Check if there's any higher card the player could have played
        const hasHigherCard = playerHand.some(c => rankValue(c.rank) > topRankVal);
        if (hasHigherCard) {
          triggerPickup();
        } else {
          playerHand.push(...middlePile);
          middlePile = [];
          renderHand(playerHand);
          renderMiddlePile();
          while (playerHand.length < 3 && deck.length > 0) {
            playerHand.push(deck.shift());
          }
          renderHand(playerHand);
          updateDeckVisual(deck);
          endPlayerTurn();
        }
      }
    } else if (selectedCards.length > 0) {
      // Check if there's any higher card the player could have played
      const hasHigherCard = playerHand.some(c => rankValue(c.rank) > topRankVal);
      if (hasHigherCard) {
        triggerPickup();
      } else {
        playerHand.push(...middlePile);
        middlePile = [];
        renderHand(playerHand);
        renderMiddlePile();
        while (playerHand.length < 3 && deck.length > 0) {
          playerHand.push(deck.shift());
        }
        renderHand(playerHand);
        updateDeckVisual(deck);
        endPlayerTurn();
      }
    }
  }

  // Deselect cards after attempting to play (valid or invalid)
  selectedCards.forEach(({ element }) => element.classList.remove("selected", "enlarged"));
  selectedCards = [];
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
  middlePileDiv.addEventListener("click", handlePlayOnMiddlePile);
  middlePile.forEach(card => {
    const cardDiv = createCardDiv(card);
    middlePileDiv.appendChild(cardDiv);
  });
}

function endPlayerTurn() {
  currentTurn = "Opponent";
  document.getElementById("first-player").textContent = "Opponent goes next!";
  initialCardPlayed = false;
  waitingForDraw = false;
  setTimeout(() => {
    opponentPlay();
    if (opponentHand.length < 3 && deck.length > 0) {
      opponentHand.push(deck.shift());
      renderOpponentHand();
      updateDeckVisual(deck);
    }
    currentTurn = "Player";
    document.getElementById("first-player").textContent = "It's your turn!";
  }, 800);
}

function opponentPlay() {
  while (opponentHand.length < 3 && deck.length > 0) {
    opponentHand.push(deck.shift());
    renderOpponentHand();
    updateDeckVisual(deck);
  }

  const topCard = middlePile[middlePile.length - 1] || null;
  let playMade = false;

  if (topCard) {
    const topVal = rankValue(topCard.rank);
    const playable = opponentHand.filter(card => rankValue(card.rank) > topVal);
    if (playable.length > 0) {
      const chosen = playable.sort((a, b) => rankValue(a.rank) - rankValue(b.rank))[0];
      opponentHand = opponentHand.filter(c => c !== chosen);
      middlePile.push(chosen);
      playMade = true;
      renderOpponentHand();
      renderMiddlePile();
    }
  } else if (middlePile.length === 0 && opponentHand.length > 0) {
    middlePile.push(opponentHand.shift());
    playMade = true;
    renderOpponentHand();
    renderMiddlePile();
  }

  if (!playMade && middlePile.length > 0) {
    opponentHand.push(...middlePile);
    middlePile = [];
    renderOpponentHand();
    renderMiddlePile();

    while (opponentHand.length < 3 && deck.length > 0) {
      opponentHand.push(deck.shift());
    }
    renderOpponentHand();
    updateDeckVisual(deck);
  }
}

document.getElementById("deck").addEventListener("click", () => {
  if (currentTurn === "Player" && waitingForDraw) {
    while (playerHand.length < 3 && deck.length > 0) {
      playerHand.push(deck.shift());
    }
    renderHand(playerHand);
    updateDeckVisual(deck);
    renderMiddlePile();
    waitingForDraw = false;
    endPlayerTurn();
  } else if (currentTurn === "Player" && playerHand.length < 3 && deck.length > 0 && !waitingForDraw) {
    playerHand.push(deck.shift());
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
  if (backs.length > 0) backs[backs.length - 1].classList.add("top-card");

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

// 🚀 Start the game
dealHand();