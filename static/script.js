// Once HTML page has loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set all options
    let options = {
        numberOfDecks: 1,
        dealerSpeed: 0,
    }
    // Create 52-card deck
    const deck = createDeck();
    // Create a list of all image names
    const imageNames = deck;
    imageNames.push('red');
    let images = {};
    let shoe = [];
    let hands = [];
    let dealer = [];
    // Preload images
    preloadImages(imageNames).then(loadedImages => {
        if (loadedImages) {
            images = loadedImages;
            shoe = shuffle(deck, options.numberOfDecks);
            [shoe, hands, dealer] = dealHand(images, shoe, options.dealerSpeed);
        }
    });
    // Reload canvas when the window is resized
    window.addEventListener('resize', function() {
        loadCanvas(images, shoe, hands, dealer);
    });
});

// Clear the game div and create a square centered canvas
function loadCanvas(images, shoe, hands, dealer) {
    document.getElementById('game').innerHTML = '';
    let canvas = document.createElement('canvas');
    let canvasSize;
    if (window.innerWidth > window.innerHeight) {
        canvasSize = window.innerHeight;
    } else {
        canvasSize = window.innerWidth;
    }
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    document.getElementById('game').appendChild(canvas);
    // Draw cards
    drawCards(images, canvas, hands, dealer, canvasSize);
}

// Draw cards to canvas
function drawCards(images, canvas, hands, dealer, canvasSize) {
    const cardWidth = canvasSize / 6;
    const cardHeight = cardWidth * 1.452;
    const dealerCardVisibility = .25;
    const dealerX = canvasSize / 2 - (cardWidth + cardWidth * dealerCardVisibility) / 2;
    const dealerY = cardWidth / 2;
    const playerCardVisibility = [.25, .25, .25, .25];
    let playerX = [];
    const playerY = cardWidth + cardHeight;
    
    // Change playerCardVisibility if hand has 5 or more cards
    for (let i = 0; i < hands.length; i++) {
        if (hands[i].length >= 5) {
            playerCardVisibility[i] = .25 / ((hands[i].length - 5) * .3 + 1.5);
        }
    }

    // Create a list of X positions that cards should be drawn at
    if (hands.length === 1) {
        playerX.push(canvasSize / 2 - (cardWidth + cardWidth * playerCardVisibility[0]) / 2);
    }
    else if (hands.length === 2) {
        playerX.push(canvasSize / 3 - (cardWidth + cardWidth * playerCardVisibility[0]) / 2);
        playerX.push(canvasSize / 3 * 2 - (cardWidth + cardWidth * playerCardVisibility[1]) / 2);
    }
    else if (hands.length === 3) {
        playerX.push(canvasSize / 8 - (cardWidth + cardWidth * playerCardVisibility[0]) / 2);
        playerX.push(canvasSize / 8 * 4 - (cardWidth + cardWidth * playerCardVisibility[0]) / 2);
        playerX.push(canvasSize / 8 * 7 - (cardWidth + cardWidth * playerCardVisibility[0]) / 2);
    }
    else if (hands.length === 4) {
        playerX = [0, canvasSize / 4, canvasSize / 2, canvasSize / 4 * 3];
    }

    // Draw dealer cards
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < dealer.length; i++) {
        if (i === 0) {
            ctx.drawImage(images['red'], dealerX, dealerY, cardWidth, cardHeight);
        } else {
            ctx.drawImage(images[dealer[i]], dealerX + (cardWidth * dealerCardVisibility * i), dealerY, cardWidth, cardHeight);
        }
    }

    // Draw player cards
    for (let hand = 0; hand < hands.length; hand++) {
        for (let card = 0; card < hands[hand].length; card++) {
            ctx.drawImage(images[hands[hand][card]], playerX[hand] + (cardWidth * playerCardVisibility[hand] * card), playerY, cardWidth, cardHeight);
        }
    }
}

// Load image
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
    });
}

// Preload images
async function preloadImages(deck) {
    const images = {};
    const promises = deck.map(card => {
        return loadImage(`static/images/${card}.png`).then(img => {
            images[card] = img;
        });
    });

    try {
        await Promise.all(promises);
        return images;
    } catch (error) {
        console.error(error);
        return null;
    }
}

// Create a standard 52 card deck
function createDeck() {
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
    const suits = ['c', 'd', 'h', 's'];
    let deck = [];
    for (let value = 0; value < values.length; value++) {
        for (let suit = 0; suit < suits.length; suit++) {
            deck.push(values[value] + suits[suit]);
        }
    }
    return deck;
}

// Shuffle deck(s)
function shuffle(deck, numberOfDecks) {
    let decks = [];
    for (let i = 0; i < numberOfDecks; i++) {
        for (let j = 0; j < deck.length; j++) {
            decks.push(deck[j]);
        }
    }
    for (let i = decks.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [decks[i], decks[j]] = [decks[j], decks[i]];
    }
    return decks;
}

// Deal hand
function dealHand(images, shoe, dealerSpeed) {
    hands = [ [] ];
    dealer = [];  
    for (i = 0; i < 2; i++) {
        
        setTimeout(() => {
            hands[0].push(shoe.pop());
            loadCanvas(images, shoe, hands, dealer);
        }, i * dealerSpeed * 2);
        
        setTimeout(() => {
            dealer.push(shoe.pop());
            loadCanvas(images, shoe, hands, dealer);
        }, i * dealerSpeed * 2 + dealerSpeed);

    }
    return [shoe, hands, dealer];
}

// ['As', 'Kh', 'Ah', 'Ac', 'Ad', '3c', '6d', '5h', 'Ah', 'Td', '4c']