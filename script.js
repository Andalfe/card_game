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
const middlePileDiv = document.getElementById("middle-pile");
const burnPileDiv = document.getElementById("burn-pile");

// New function to clear selected cards
function clearSelectedCards() {
  selectedCards.forEach(({ element }) => {
    if (element && element.classList) {
      element.classList.remove("selected", "enlarged");
    }
  });
  selectedCards = [];
}

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

function countRankInMiddlePile(rank) {
  return middlePile.filter(card => card.rank === rank).length;
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
  clearSelectedCards(); // Clear any selections when dealing new hand

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
  updateMiddlePileGlow();

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

    cardDiv.addEventListener("click", () => {
      if (currentTurn !== "Player" || waitingForDraw) return;

      const isSelected = selectedCards.some(sel => sel.element === cardDiv);
      if (isSelected) {
        cardDiv.classList.remove("selected", "enlarged");
        selectedCards = selectedCards.filter(sel => sel.element !== cardDiv);
      } else if (selectedCards.length < 4) {
        cardDiv.classList.add("selected", "enlarged");
        selectedCards.push({ card, element: cardDiv });
      } else {
        // Visual feedback instead of alert
        cardDiv.classList.add("shake");
        setTimeout(() => cardDiv.classList.remove("shake"), 500);
      }
    });

    cardDiv.addEventListener("dblclick", () => {
      if (currentTurn === "Player" && !waitingForDraw) {
        clearSelectedCards(); // Clear any existing selections
        playSingleCardWithDoubleClick(card, cardDiv);
      }
    });

    handContainer.appendChild(cardDiv);
    setTimeout(() => cardDiv.classList.add("revealed"), index * 100);
  });
}

function canPlayCard(card) {
  if (middlePile.length === 0) {
    return true;
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
      
      // Check if this creates four of a kind
      const currentCount = countRankInMiddlePile(card.rank);
      if (currentCount === 4) {
        const cardsToBurn = middlePile.filter(c => c.rank === card.rank);
        sendCardsToBurnPile(cardsToBurn);
        middlePile = middlePile.filter(c => c.rank !== card.rank);
        
        if (playerHand.length < 3 && deck.length > 0) {
          waitingForDraw = true;
          document.getElementById("first-player").textContent = "Click the deck to draw.";
        }
      } 
      else if (card.rank === "10") {
        burnMiddlePile();
        if (playerHand.length < 3 && deck.length > 0) {
          waitingForDraw = true;
          document.getElementById("first-player").textContent = "Click the deck to draw.";
        }
      } 
      else {
        renderMiddlePile();
        updateMiddlePileGlow();
        clearSelectedCards();
        if (playerHand.length < 3 && deck.length > 0) {
          waitingForDraw = true;
          document.getElementById("first-player").textContent = "Click the deck to draw.";
        } else {
          endPlayerTurn();
        }
      }
    } else {
      const hasHigherCard = playerHand.some(c => rankValue(c.rank) > rankValue(middlePile[middlePile.length - 1].rank));
      if (hasHigherCard) {
        triggerPickup();
      } else {
        playerHand.push(...middlePile);
        middlePile = [];
        renderHand(playerHand);
        renderMiddlePile();
        updateMiddlePileGlow();
        while (playerHand.length < 3 && deck.length > 0) {
          playerHand.push(deck.shift());
        }
        renderHand(playerHand);
        updateDeckVisual(deck);
        clearSelectedCards();
        endPlayerTurn();
      }
    }
  }
}

function burnMiddlePile() {
  if (middlePile.length === 0) return;
  
  sendCardsToBurnPile([...middlePile]);
  middlePile = [];
  renderMiddlePile();
  updateMiddlePileGlow();
  
  middlePileDiv.classList.add('burn-animation');
  setTimeout(() => middlePileDiv.classList.remove('burn-animation'), 800);
}

function sendCardsToBurnPile(cards) {
  if (!burnPileDiv) return;

  let burnedCardsContainer = burnPileDiv.querySelector('.burned-cards-container');
  if (!burnedCardsContainer) {
    burnedCardsContainer = document.createElement('div');
    burnedCardsContainer.className = 'burned-cards-container';
    burnedCardsContainer.style.position = 'relative';
    burnedCardsContainer.style.width = '100%';
    burnedCardsContainer.style.height = '100%';
    burnPileDiv.appendChild(burnedCardsContainer);
  }

  let verticalOffset = burnedCardsContainer.children.length * 15;
  const maxRotation = 15;
  const maxHorizontalOffset = 10;

  cards.forEach((card, index) => {
    const cardDiv = createCardDiv(card);
    cardDiv.classList.add("burned-card");

    const rotation = Math.floor(Math.random() * (maxRotation * 2)) - maxRotation;
    const horizontalOffset = Math.floor(Math.random() * (maxHorizontalOffset * 2)) - maxHorizontalOffset;

    cardDiv.style.position = 'absolute';
    cardDiv.style.transform = `rotate(${rotation}deg)`;
    cardDiv.style.left = `${50 + horizontalOffset}%`;
    cardDiv.style.top = `${verticalOffset}px`;
    cardDiv.style.marginLeft = '-50px';
    cardDiv.style.zIndex = burnedCardsContainer.children.length + index + 1;
    cardDiv.style.transition = 'all 0.3s ease';

    burnedCardsContainer.appendChild(cardDiv);
  });

  burnPileDiv.classList.add('burn-animation');
  setTimeout(() => burnPileDiv.classList.remove('burn-animation'), 500);
}

function triggerPickup() {
  incorrectMoveSound.play();
  playerHand.push(...middlePile);
  middlePile = [];
  renderHand(playerHand);
  renderMiddlePile();
  updateMiddlePileGlow();
  
  while (playerHand.length < 3 && deck.length > 0) {
    playerHand.push(deck.shift());
  }
  
  renderHand(playerHand);
  updateDeckVisual(deck);
  clearSelectedCards();
  
  // Immediately switch to opponent's turn after pickup
  currentTurn = "Opponent";
  document.getElementById("first-player").textContent = "Opponent's turn after pickup";
  
  setTimeout(() => {
    opponentPlay();
    // After opponent plays, switch back to player
    currentTurn = "Player";
    document.getElementById("first-player").textContent = "It's your turn!";
  }, 1000);
}




function handlePlayOnMiddlePile() {
  if (currentTurn !== "Player" || waitingForDraw || selectedCards.length === 0) {
    return;
  }

  if (selectedCards.length > 4) {
    clearSelectedCards();
    return;
  }

  const hasTenSelected = selectedCards.some(sel => sel.card.rank === "10");
  const firstRank = selectedCards[0].card.rank;
  const allSameRankSelected = selectedCards.every(sel => sel.card.rank === firstRank);

  // Track if we're burning
  let burnedThisTurn = false;

  // If player selected one or more 10s, burn the entire middle pile
  if (hasTenSelected) {
    burnMiddlePile();
    selectedCards.forEach(({ card, element }) => {
      playerHand = playerHand.filter(c => c !== card);
      element.remove();
    });
    burnedThisTurn = true;
  } 
  // Normal play logic
  else if (middlePile.length === 0 || rankValue(firstRank) >= rankValue(middlePile[middlePile.length - 1].rank)) {
    selectedCards.forEach(({ card, element }) => {
      middlePile.push(card);
      playerHand = playerHand.filter(c => c !== card);
      element.remove();
    });

    // Check for four of a kind in ENTIRE middle pile
    if (middlePile.length >= 4) {
      const lastCard = middlePile[middlePile.length - 1];
      const fourOfAKind = middlePile.filter(card => card.rank === lastCard.rank).length >= 4;
      
      if (fourOfAKind) {
        burnMiddlePile();
        middlePile = [];
        burnedThisTurn = true;
      }
    }
  } else {
    triggerPickup();
    return;
  }

  // Update visuals
  renderHand(playerHand);
  renderMiddlePile();
  updateMiddlePileGlow();
  clearSelectedCards();

  // After burning, player must play another card (can't end turn yet)
  if (burnedThisTurn) {
    if (playerHand.length === 0) {
      // No cards left to play - must draw
      if (deck.length > 0) {
        waitingForDraw = true;
        document.getElementById("first-player").textContent = "You must draw a card to continue";
      } else {
        // No cards left at all - end turn
        endPlayerTurn();
      }
    } else {
      document.getElementById("first-player").textContent = "Play another card (after burning)";
    }
    return;
  }

  // Normal turn end
  if (playerHand.length < 3 && deck.length > 0) {
    waitingForDraw = true;
    document.getElementById("first-player").textContent = `Click the deck to draw ${3 - playerHand.length} card(s).`;
  } else {
    endPlayerTurn();
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
  if (!middlePileDiv) return;

  middlePileDiv.innerHTML = "";
  middlePileDiv.removeEventListener("click", handlePlayOnMiddlePile);
  middlePileDiv.addEventListener("click", handlePlayOnMiddlePile);

  middlePile.forEach(card => {
    const cardDiv = createCardDiv(card);
    middlePileDiv.appendChild(cardDiv);
  });
  updateMiddlePileGlow();
}

function endPlayerTurn() {
  clearSelectedCards();
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
  // First draw if needed
  while (opponentHand.length < 3 && deck.length > 0) {
    opponentHand.push(deck.shift());
    renderOpponentHand();
    updateDeckVisual(deck);
  }

  const topCard = middlePile.length > 0 ? middlePile[middlePile.length - 1] : null;
  let playMade = false;
  let burnedThisTurn = false;

  // Check for 10s in hand (regardless of middle pile)
  const opponentTens = opponentHand.filter(card => card.rank === "10");
  if (opponentTens.length > 0) {
    const tenToPlay = opponentTens[0];
    opponentHand = opponentHand.filter(c => c !== tenToPlay);
    
    if (middlePile.length > 0) {
      middlePile.push(tenToPlay);
      burnMiddlePile();
    } else {
      sendCardsToBurnPile([tenToPlay]);
    }
    burnedThisTurn = true;
    playMade = true;
  }

  // Normal card play logic (only if didn't just burn with 10)
  if (!burnedThisTurn) {
    if (topCard) {
      const topVal = rankValue(topCard.rank);
      const playable = opponentHand.filter(card => rankValue(card.rank) >= topVal);
      
      if (playable.length > 0) {
        const chosenCard = playable.reduce((lowest, current) => 
          rankValue(current.rank) < rankValue(lowest.rank) ? current : lowest
        );
        
        middlePile.push(chosenCard);
        opponentHand = opponentHand.filter(c => c !== chosenCard);
        playMade = true;

        // Check for four of a kind in ENTIRE middle pile
        if (middlePile.length >= 4) {
          const lastCard = middlePile[middlePile.length - 1];
          const fourOfAKind = middlePile.filter(card => card.rank === lastCard.rank).length >= 4;
          
          if (fourOfAKind) {
            burnMiddlePile();
            middlePile = [];
            burnedThisTurn = true;
          }
        }
      }
    } else if (opponentHand.length > 0) {
      const cardToPlay = opponentHand.reduce((lowest, current) => 
        rankValue(current.rank) < rankValue(lowest.rank) ? current : lowest
      );
      middlePile.push(cardToPlay);
      opponentHand = opponentHand.filter(c => c !== cardToPlay);
      playMade = true;
    }
  }

  // If no play was made and there are cards in middle pile, opponent must pick up
  if (!playMade && middlePile.length > 0) {
    opponentHand.push(...middlePile);
    middlePile = [];
  }

  // Update visuals
  renderOpponentHand();
  renderMiddlePile();
  updateMiddlePileGlow();

  // Draw more cards if needed
  while (opponentHand.length < 3 && deck.length > 0) {
    opponentHand.push(deck.shift());
  }
  renderOpponentHand();
  updateDeckVisual(deck);

  // After burning, opponent must play another card if possible
  if (burnedThisTurn && opponentHand.length > 0) {
    setTimeout(opponentPlay, 1000);
    return;
  }

  // Normal turn end
  if (playMade && !burnedThisTurn) {
    setTimeout(() => {
      currentTurn = "Player";
      document.getElementById("first-player").textContent = "It's your turn!";
    }, 1000);
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
    updateMiddlePileGlow();
    waitingForDraw = false;
    endPlayerTurn();
  } else if (currentTurn === "Player" && playerHand.length < 3 && deck.length > 0 && !waitingForDraw) {
    playerHand.push(deck.shift());
    renderHand(playerHand);
    updateDeckVisual(deck);
    renderMiddlePile();
    updateMiddlePileGlow();
    endPlayerTurn();
  }
});

function updateDeckVisual(currentDeck) {
  const deckContainer = document.getElementById("deck");
  deckContainer.innerHTML = "";

  if (currentDeck.length === 0) {
    deckContainer.classList.add("empty-highlight");
  } else {
    deckContainer.classList.remove("empty-highlight");
    currentDeck.forEach((_, i) => {
      const back = document.createElement("div");
      back.className = "card-back";
      back.style.zIndex = i + 1;
      back.style.transform = `translateX(${-i * 0.5}px) translateY(${-i * 0.5}px)`;
      deckContainer.appendChild(back);
    });

    const backs = deckContainer.querySelectorAll(".card-back");
    if (backs.length > 0) backs[backs.length - 1].classList.add("top-card");
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

function updateMiddlePileGlow() {
  if (middlePileDiv) {
    if (middlePile.length === 0) {
      middlePileDiv.classList.add('empty');
      middlePileDiv.classList.add('glow');
    } else {
      middlePileDiv.classList.remove('glow');
      middlePileDiv.classList.remove('empty');
    }
  }
}

// Start the game
dealHand();