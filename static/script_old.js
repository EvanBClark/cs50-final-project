// Once HTML page has loaded
document.addEventListener('DOMContentLoaded', function() {
    let images = {};
    let shoe = [];
    let hands = [];
    let dealer = [];
    let bet = [];
    let phase = 'bet';
    // Set all options
    let options = {
        numberOfDecks: 1,
        dealerSpeed: 0,
        showHandTotals: true,
    };
    // Create 52-card deck
    const deck = createDeck();
    // Create a list of all image names
    const imageNames = [...deck];
    imageNames.push('red');
    // Preload images
    preloadImages(imageNames).then(loadedImages => {
        if (loadedImages) {
            images = loadedImages;
            shoe = shuffle(deck, options.numberOfDecks);
            let [canvas, canvasSize] = loadCanvas(images, shoe, hands, dealer, phase, options);
            placeBet(images, canvas, hands, dealer, shoe, canvasSize, phase, options);
        }
    });
    // Reload canvas when the window is resized
    window.addEventListener('resize', function() {
        loadCanvas(images, shoe, hands, dealer, phase, options);
    });
});

function placeBet(images, canvas, hands, dealer, shoe, canvasSize, phase, options) {
    // Variables for button position
    const x = canvasSize / 2; // Adjust as needed
    const y = canvasSize * 3 / 4; // Adjust as needed

    // Remove existing button and input elements if they exist
    const existingButton = document.getElementById('betButton');
    if (existingButton) {
        existingButton.remove();
    }

    const existingInput = document.getElementById('betInput');
    if (existingInput) {
        existingInput.remove();
    }

    // Get the existing canvas
    canvas = document.querySelector('canvas');
    const canvasRect = canvas.getBoundingClientRect();

    // Create and style the text field
    const textField = document.createElement('input');
    textField.type = 'text';
    textField.id = 'betInput';
    textField.style.position = 'absolute';
    textField.style.top = `${canvasRect.top + y}px`; // Use y variable
    textField.style.left = `${canvasRect.left + x - 100}px`; // Position left of the button
    textField.style.width = '120px'; // Adjust width to avoid overlap
    textField.style.padding = '10px';
    textField.style.fontSize = '16px';

    document.body.appendChild(textField);

    // Create and style the button
    const button = document.createElement('button');
    button.id = 'betButton';
    button.innerText = 'Bet';
    button.style.position = 'absolute';
    button.style.top = `${canvasRect.top + y}px`; // Use y variable
    button.style.left = `${canvasRect.left + x}px`; // Use x variable

    // Add styles for border and gradient
    button.style.border = '2px solid #000';
    button.style.background = 'linear-gradient(to bottom, lightblue, blue)';
    button.style.color = 'white';
    button.style.padding = '10px 20px';
    button.style.borderRadius = '5px';
    button.style.fontSize = '16px';
    button.style.cursor = 'pointer';

    document.body.appendChild(button);

    // Add event listener to the button
    button.addEventListener('click', function() {
        const betValue = document.getElementById('betInput').value;
        console.log('Bet value:', betValue);
        [shoe, hands, dealer] = dealHand(images, canvas, hands, dealer, shoe, canvasSize, phase, options);
        drawCards(images, canvas, hands, dealer, canvasSize, phase, options);
    });
}

// Clear the game div and create a square centered canvas
function loadCanvas(images, shoe, hands, dealer, phase, options) {
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
    return [canvas, canvasSize];
}

// Draw cards to canvas
function drawCards(images, canvas, hands, dealer, canvasSize, phase, options) {
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
    // Draw dealer cards and total
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < dealer.length; i++) {
        if (i === 0) {
            ctx.drawImage(images['red'], dealerX, dealerY, cardWidth, cardHeight);
        }
        else {
            ctx.drawImage(images[dealer[i]], dealerX + (cardWidth * dealerCardVisibility * i), 
            dealerY, cardWidth, cardHeight);
        }
        if (phase === 'dealer' && options.showHandTotals === true) {
            drawTotal(ctx, dealer, cardWidth, canvasSize / 2, cardWidth / 8 * 3, true);
        }
    }
    // Draw player cards and total(s)
    for (let hand = 0; hand < hands.length; hand++) {
        for (let card = 0; card < hands[hand].length; card++) {
            ctx.drawImage(images[hands[hand][card]],
            playerX[hand] + (cardWidth * playerCardVisibility[hand] * card),
            playerY, cardWidth, cardHeight);
        }
        if (options.showHandTotals === true) {
            drawTotal(ctx, hands[hand], cardWidth, playerX[hand] + cardWidth * 1.25 / 2,
            playerY - cardWidth / 8, false)
        }
    }
}

// Draw total value above hand
function drawTotal(ctx, hand, cardWidth, x, y, isDealerHand) {
    const fontSize = Math.round(cardWidth / 4);
    ctx.font = fontSize + 'px Arial';
    ctx.fillStyle = 'white';
    let total = getTotal(hand);
    if (isDealerHand && total.length === 2 && total[1] > 17) {
        total = [total[1]]
    }
    if (total.length === 2) {
        total = total[0].toString() + '/' + total[1].toString();
    }
    ctx.fillText(total, x - ctx.measureText(total).width / 2, y);
}

// Return total value of hand
function getTotal(hand) {
    let total = [0];
    for (let card = 0; card < hand.length; card++) {
        if (hand[card][0] === 'A') {
            if (total.length === 1) {
                total = [total[0] + 1, total[0] + 11];
            }
            else if (total.length === 2) {
                total = [total[0] + 1, total[1] + 1]
            }
        }
        else if (hand[card][0] === 'K' || hand[card][0] === 'Q' || hand[card][0] === 'J' || hand[card][0] === 'T') {
            for (let i = 0; i < total.length; i++) {
                total[i] += 10;
            }
        }
        else {
            for (let i = 0; i < total.length; i++) {
                total[i] += Number(hand[card][0]);
            }
        }
    }
    if (total.length === 2 && total[1] > 21) {
        total.pop();
    }
    return total;
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
function dealHand(images, canvas, hands, dealer, shoe, canvasSize, phase, options) {
    hands = [ [] ];
    dealer = [];
    for (i = 0; i < 2; i++) {
        setTimeout(() => {
            hands[0].push(shoe.pop());
            drawCards(images, canvas, hands, dealer, canvasSize, phase, options);
        }, i * options.dealerSpeed * 2);
        
        setTimeout(() => {
            dealer.push(shoe.pop());
            drawCards(images, canvas, hands, dealer, canvasSize, phase, options);
        }, i * options.dealerSpeed * 2 + options.dealerSpeed);
    }
    return [shoe, hands, dealer];
}

// ['As', 'Kh', 'Ah', 'Ac', 'Ad', '3c', '6d', '5h', 'Ah', 'Td', '4c']