// Create global variables
let shoe = [];
let dealer = [];
let hands = [ [] ];
let bets = [];
let lastBet = null;
let cash = 100;
let phase = 'bet'; // bet, player, dealer, animation
let activeHand = 0;
let insured = 0;
let images = {};
let dataUrls = {};

// Store all options in a global variable
let options = {
    numberOfDecks: 6,
    shoePenatration: .75, // percent of shoe dealer will deal before reshuffling
    soft17: 'hits', // hits, stands
    doubleAfterSplit: true,
    doubleVariation: 'allCards', // 'allCards' or '9,10,11' // STILL NEED TO ADD
    surrender: 'notAllowed', // notAllowed, nonAces, allCards // Only supports late surrender
    dealerPeak: true,
    insurance: false,
    splitAces1Card: true,
    showHandTotals: true,
    dealerSpeed: 500, // in milliseconds
    hitKey: ' ',
    standKey: 'Enter',
    doubleKey: 'd',
    splitKey: 's',
    surrenderKey: 'u',
};

// Once HTML page has loaded, preload Images
document.addEventListener('DOMContentLoaded', function() { 
    preloadImages(); 
});

// If window is resized, redraw game
window.addEventListener('resize', function() {
    drawGame();
});

// Main function
function main() {
    addKeyboardEventListeners();
    shoe = shuffle(options.numberOfDecks);
    drawGame();
}

function addKeyboardEventListeners() {
    // Hit keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.hitKey) {
            hit();
        }
    });
    // Stand keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.standKey) {
            nextHand();
        }
    });
    // Double keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.doubleKey) {
            double();
        }
    });
    // Split keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.splitKey) {
            split();
        }
    });
    // Surrender keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.surrenderKey) {
            surrender();
        }
    });
}

// Load image
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.draggable = false;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
    });
}

// Pre-load all images
async function preloadImages() {
    const fileNames = createDeck();
    const otherFileNames = ['chips', 'settings', 'red'];
    for (let i = 0; i < otherFileNames.length; i++) {
        fileNames.push(otherFileNames[i]);
    }
    const promises = fileNames.map(card => {
        return loadImage(`static/images/${card}.png`).then(img => {
            images[card] = img;
        });
    });

    try {
        await Promise.all(promises);
        for (let key in images) {
            dataUrls[key] = getDataUrl(images[key]);
        }
        main();
    } catch (error) {
        console.error(error);
    }
}

function getDataUrl(img) {
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL();
}

function drawSettings(gameSize) {
    document.getElementById('game').innerHTML = '';
    title = document.createElement('span');
    title.innerHTML = 'Settings';
    title.style.fontSize = (gameSize / 15) + 'px';
    document.getElementById('game').appendChild(title);


    // TODO: Add all settings


}

function drawGame() {
    const container = document.getElementById('container');
    // If game div exists, delete everything in it, else create it
    let game = document.getElementById('game');
    if (game) {
        game.innerHTML = '';
    }
    else {
        game = document.createElement('div');
        game.id = 'game';
        game.style.textAlign = 'center';
        container.appendChild(game);
    }
    // Make game div a square using the smallest of the container's dimensions
    let gameSize;
    if (container.clientWidth >= container.clientHeight) {
        gameSize = container.clientHeight;
    } else {
        gameSize = container.clientWidth;
    }
    game.style.width = gameSize + 'px';
    game.style.height = gameSize + 'px';
    game.style.position = 'relative';
    document.getElementById('container').appendChild(game);
    // Define constants
    const iconSize = gameSize / 15;
    const iconMargin = gameSize / 150;
    const cardWidth = gameSize / 5;
    const cardHeight = cardWidth * 1.452;
    // Draw the contents of the game
    drawHeader(gameSize, iconSize, iconMargin);
    drawDealer(gameSize, iconSize, iconMargin, cardWidth);
    drawPlayer(gameSize, iconSize, iconMargin, cardWidth, cardHeight);

    

    // drawBet or drawButtons depending on game phase
    if (phase === 'bet') {
        drawBet(gameSize, iconSize);
    }
    else {
        drawButtons(gameSize, iconSize);
    }
}

function drawHeader(gameSize, iconSize, iconMargin) {
    // Make a header div
    const headerDiv = document.createElement('div');
    headerDiv.id = 'headerDiv';
    document.getElementById('game').appendChild(headerDiv);
    // Draw chips icon
    let chipsIcon = document.createElement('img');
    chipsIcon.src = dataUrls['chips'];
    chipsIcon.id = 'chipsIcon'
    chipsIcon.height = iconSize;
    chipsIcon.draggable = false;
    chipsIcon.style.position = 'absolute';
    chipsIcon.style.top = iconMargin + 'px';
    chipsIcon.style.left = iconMargin + 'px';
    headerDiv.appendChild(chipsIcon);
    // Draw chips value
    chipsValue = document.getElementById('chipsValue')
    if (!chipsValue) {
        chipsValue = document.createElement('span');
        chipsValue.id = 'chipsValue';
        chipsValue.style.fontSize = iconSize + 'px';
        chipsValue.style.position = 'absolute';
        chipsValue.style.left = (iconMargin + iconSize) + 'px';
        headerDiv.appendChild(chipsValue);
    }
    chipsValue.innerHTML = cash;
    // Draw settings icon
    const settingsIcon = document.getElementById('settingsIcon');
    if (!settingsIcon) {
        images['settings'].id = 'settingsIcon';
        images['settings'].height = iconSize;
        images['settings'].style.position = 'absolute';
        images['settings'].style.top = (gameSize / 150) + 'px';
        images['settings'].style.right = iconMargin + 'px';
        images['settings'].addEventListener('click', function() {
            drawSettings(gameSize);
        });
        headerDiv.appendChild(images['settings']);
    }
}

function drawDealer(gameSize, iconSize, iconMargin, cardWidth) {
    // Draw dealer div
    let dealerDiv = document.getElementById('dealer');
    if(dealerDiv) {
        dealerDiv.innerHTML = '';
    }
    else {
        dealerDiv = document.createElement('div');
        dealerDiv.id = 'dealer';
        document.getElementById('game').appendChild(dealerDiv);
    }
    // Determine whether to show dealer's hole card
    let showHoleCard = false;
    if (phase === 'dealer' || phase === 'bet') {
        showHoleCard = true;
    }
    else {
        showHoleCard = false;
    }
    // Draw dealer total
    if (options.showHandTotals && showHoleCard && lastBet) {
        const dealerTotal = document.createElement('span');
        dealerTotal.innerHTML = getTotal(dealer);
        dealerTotal.style.fontSize = iconSize + 'px';
        document.getElementById('dealer').appendChild(dealerTotal);
    }
    // Draw dealer's cards
    for (let c = 0; c < dealer.length; c++) {
        let card = document.createElement('img');
        card.src = dataUrls[dealer[c]];
        if (!showHoleCard && c === 0) {
            card.src = dataUrls['red'];
        }
        card.width = cardWidth;
        card.draggable = false;
        card.style.position = 'absolute';
        card.style.top = (iconSize + iconMargin) + 'px';
        card.style.left = (gameSize / 2 - cardWidth * 5/8 + cardWidth / 4 * c) + 'px';
        document.getElementById('dealer').appendChild(card);
    }
}

function drawPlayer(gameSize, iconSize, iconMargin, cardWidth, cardHeight) {
    // Calculate player hand locations
    let handLocations = [];
    if (hands.length === 1) {
        handLocations = [gameSize / 2  - cardWidth * 5/8];
    }
    else if (hands.length === 2) {
        handLocations = [gameSize / 3 * 2  - cardWidth * 5/8, gameSize / 3  - cardWidth * 5/8];
    }
    else if (hands.length === 3) {
        handLocations = [gameSize / 3 * 2, gameSize / 3, 0]
    }
    else if (hands.length === 4) {
        handLocations = [gameSize / 4 * 3, gameSize / 4 * 2, gameSize / 4, 0]
    }
    // Draw player div
    const playerDiv = document.createElement('div');
    playerDiv.id = 'player';
    document.getElementById('game').appendChild(playerDiv);
    for (let hand = 0; hand < hands.length; hand++) {
        // Draw player hand total(s)
        if (options.showHandTotals && lastBet) {
            const handTotal = document.createElement('span');
            handTotal.id = 'handTotal' + hand;
            handTotal.innerHTML = getTotal(hands[hand]);
            handTotal.style.fontSize = iconSize + 'px';
            handTotal.style.position = 'absolute';
            handTotal.style.top = (iconSize * 1.5 + iconMargin + cardHeight) + 'px';
            document.getElementById('player').appendChild(handTotal);
            const handTotalWidth = handTotal.getBoundingClientRect().width;
            document.getElementById('handTotal' + hand).style.left =
            (handLocations[hand] + cardWidth * 5/8 - handTotalWidth / 2) + 'px';
        }
        // Draw player hand(s)
        for (let card = 0; card < hands[hand].length; card++) {
            let c = document.createElement('img');
            c.src = dataUrls[hands[hand][card]];
            c.width = cardWidth;
            c.draggable = false;
            c.style.position = 'absolute';
            c.style.top = (iconSize * 2.6 + iconMargin + cardHeight) + 'px';
            c.style.left = (handLocations[hand] + cardWidth / 4 * card) + 'px';
            document.getElementById('player').appendChild(c);
        }
        // Draw player bet(s)
        if (lastBet) {
            // Create betDiv
            const betDiv = document.createElement('div');
            betDiv.style.position = 'absolute';
            betDiv.style.top = (iconSize * 2.6 + iconMargin + cardHeight * 2) + 'px';
            // Draw player active hand
            if (hands.length > 1 && hand === activeHand && (phase === 'player' || phase === 'animation')) {
                betDiv.classList = 'activeBet';
            }
            document.getElementById('player').appendChild(betDiv);
            // Draw chips icon
            let chipsIcon = document.createElement('img');
            chipsIcon.src = dataUrls['chips'];
            chipsIcon.id = 'chipsIcon'
            chipsIcon.height = iconSize * .8;
            chipsIcon.draggable = false;
            chipsIcon.style.position = 'relative';
            chipsIcon.style.marginTop = iconSize / 10 + 'px';
            betDiv.appendChild(chipsIcon);
            // Draw bet
            const bet = document.createElement('span');
            bet.id = 'bet' + hand;
            bet.innerHTML = bets[hand];
            bet.style.fontSize = iconSize + 'px';
            bet.style.position = 'relative';
            betDiv.appendChild(bet);
            // Center betDiv
            const betWidth = betDiv.getBoundingClientRect().width;
            betDiv.style.left =
            (handLocations[hand] + cardWidth * 5/8 - betWidth / 2) + 'px';
        }        
    }
}

// Take bet
function drawBet(gameSize, iconSize) {
    // If shoe is getting low, reshuffle
    const shuffling = document.createElement('p');
    shuffling.id = 'shuffling'
    shuffling.innerHTML = 'Shuffling'
    if (shoe.length < options.numberOfDecks * 52 * (1 - options.shoePenatration)) {
        shoe = shuffle(options.numberOfDecks);
        document.getElementById('game').appendChild(shuffling);
    }
    // Create placeBetDiv
    const placeBetDiv = document.createElement('div');
    placeBetDiv.style.position = 'absolute';
    placeBetDiv.style.bottom = iconSize / 4 + 'px';
    document.getElementById('game').appendChild(placeBetDiv);

    // Create bet input field
    const input = document.createElement('input');
    input.id = 'betValue';
    input.type = 'number';
    input.min = 1;
    input.style.height = iconSize + 'px';
    input.style.width = iconSize * 2 + 'px';
    input.style.fontSize = iconSize * .8 +'px';
    if (lastBet) {
        input.value = lastBet;
    }
    placeBetDiv.appendChild(input);
    document.getElementById('betValue').focus();
    // Create Bet button
    const button = document.createElement('button');
    button.id = 'betButton';
    button.innerHTML = 'Bet';
    button.style.height = iconSize + 'px';
    button.style.width = iconSize * 2 + 'px';
    button.style.fontSize = iconSize * .8 +'px';
    button.style.margin = iconSize / 10 + 'px';
    button.style.borderRadius = iconSize / 5 + 'px';
    placeBetDiv.appendChild(button);
    button.addEventListener('click', betPlaced);
    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            betPlaced();
        }
    })
    // Center placeBetDiv
    placeBetDivWidth = placeBetDiv.getBoundingClientRect().width;
    placeBetDiv.style.left = (gameSize / 2 - placeBetDivWidth / 2) + 'px';
}

// Draw buttons
function drawButtons(gameSize, iconSize) {
    // Create buttonsDiv
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.position = 'absolute';
    buttonsDiv.style.bottom = iconSize / 4 + 'px';
    document.getElementById('game').appendChild(buttonsDiv);
    // Create topButtonsDiv
    const topButtonsDiv = document.createElement('div');
    buttonsDiv.appendChild(topButtonsDiv);
    // Create topButtonsDiv
    const bottomButtonsDiv = document.createElement('div');
    buttonsDiv.appendChild(bottomButtonsDiv);
    // Create hit button
    const hitButton = document.createElement('button');
    hitButton.id = 'hitButton';
    hitButton.innerHTML = 'Hit';
    hitButton.style.height = iconSize + 'px';
    hitButton.style.width = iconSize * 5 + 'px';
    hitButton.style.fontSize = iconSize * .7 + 'px';
    hitButton.style.borderRadius = iconSize / 5 + 'px';
    hitButton.style.margin = iconSize / 20 +'px';
    topButtonsDiv.appendChild(hitButton);
    hitButton.addEventListener('click', hit);
    // Create stand button
    const standButton = document.createElement('button');
    standButton.id = 'standButton';
    standButton.innerHTML = 'Stand';
    standButton.style.height = iconSize + 'px';
    standButton.style.width = iconSize * 5 + 'px';
    standButton.style.fontSize = iconSize * .7 + 'px';
    standButton.style.borderRadius = iconSize / 5 + 'px';
    standButton.style.margin = iconSize / 20 +'px';
    topButtonsDiv.appendChild(standButton);
    standButton.addEventListener('click', nextHand);
    // Create double button
    const doubleButton = document.createElement('button');
    doubleButton.innerHTML = 'Double';
    doubleButton.id = 'doubleButton';
    doubleButton.style.height = iconSize + 'px';
    doubleButton.style.fontSize = iconSize * .7 + 'px';
    doubleButton.style.borderRadius = iconSize / 5 + 'px';
    doubleButton.style.margin = iconSize / 20 +'px';
    bottomButtonsDiv.appendChild(doubleButton);
    doubleButton.addEventListener('click', double);
    // Create split button
    const splitButton = document.createElement('button');
    splitButton.innerHTML = 'Split';
    splitButton.id = 'splitButton';
    splitButton.style.height = iconSize + 'px';
    splitButton.style.fontSize = iconSize * .7 + 'px';
    splitButton.style.borderRadius = iconSize / 5 + 'px';
    splitButton.style.margin = iconSize / 20 +'px';
    bottomButtonsDiv.appendChild(splitButton);
    splitButton.addEventListener('click', split);

    if (options.surrender === 'notAllowed') {
        doubleButton.style.width = iconSize * 5 + 'px';
        splitButton.style.width = iconSize * 5 + 'px';
    }
    else {
        // Create surrender button
        const surrenderButton = document.createElement('button');
        surrenderButton.id = 'surrenderButton';
        surrenderButton.innerHTML = 'Surrender';
        surrenderButton.style.height = iconSize + 'px';
        surrenderButton.style.fontSize = iconSize * .7 + 'px';
        surrenderButton.style.borderRadius = iconSize / 5 + 'px';
        surrenderButton.style.margin = iconSize / 20 +'px';
        bottomButtonsDiv.appendChild(surrenderButton);
        surrenderButton.addEventListener('click', surrender);
        // Set bottom row button widths
        doubleButton.style.width = iconSize * (3 + 1 / 3) + 'px';
        splitButton.style.width = iconSize * (3 + 1 / 3) + 'px';
        surrenderButton.style.width = iconSize * (3 + 1 / 3) + 'px';
    }

    // Center buttonsDiv
    buttonsDivWidth = buttonsDiv.getBoundingClientRect().width;
    buttonsDiv.style.left = (gameSize / 2 - buttonsDivWidth / 2) + 'px';
}

function betPlaced() {
    const input = document.getElementById('betValue');
    const button = document.getElementById('betButton');
    const shuffling = document.getElementById('shuffling');
    // Get bet value and parseInt
    let betValue = input.value;
    betValue = parseInt(betValue);
    // Check to make sure bet is valid
    if (Number.isInteger(betValue) && betValue > 0) {
        if (betValue <= cash) {
            // Clean up last hand data
            dealer = [];
            hands = [ [] ];
            activeHand = 0;
            insured = 0;
            // Set bet
            bets = [betValue];
            // Save bet for next hand
            lastBet = betValue;
            // Remove text field and button
            input.remove();
            button.remove();
            if (shuffling) {
                shuffling.remove();
            }
            // Deduct cash
            cash -= betValue;
            // Deal hand
            phase = 'animation';
            dealHand();
        }
        else {
            alert('Not enough cash.')
        }
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
function shuffle(numberOfDecks) {
    const deck = createDeck();
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
    // DEV ONLY
    // decks = ['2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s', '2s'];
    // decks = ['As', 'As', 'As', 'As', 'As', 'As', 'As', 'As', 'As', 'As', 'As', 'As', 'As', 'As', 'As', 'As', 'As', 'As', 'As'];
    // options.shoePenatration = 1;
    // decks = ['Qh', 'Ks', '5h', '5c', '3h', '4s', '6h', '3s', '2d' ,'4s', 'As', '5d', '3s', '4h', '8c', '2s', '8h', 'Kh', '8s', '7h', '8d'];
    return decks;
}

// Deal hand
function dealHand() {
    // Deal 2 cards to the dealer and player
    for (let i = 0; i < 2; i++) {
        setTimeout(() => {
            hands[0].push(shoe.pop());
            drawGame();
        }, i * options.dealerSpeed * 2);
        setTimeout(() => {
            dealer.push(shoe.pop());
            drawGame();
            // After dealing cards, check for blackjack
            if (i === 1) {
                setTimeout(() => {
                    peak();
                }, 100); // Small delay to ensure card is drawn
            }
        }, i * options.dealerSpeed * 2 + options.dealerSpeed);
    }
}

function peak() {
    // Offer insurance
    if (options.insurance && dealer[1][0] === 'A') {
        setTimeout(() => {
            if (confirm('Would you like insurance?')) {
                if (cash >= Math.trunc(bets[activeHand] / 2)) {
                    insured = Math.trunc(bets[activeHand] / 2);
                    cash -= Math.trunc(bets[activeHand] / 2);
                    drawGame();
                } else {
                    alert("You don't have enough chips to buy insurance.");
                }
            }
            continuePeak();
        }, 0);
    } else {
        continuePeak();
    }
}

function continuePeak() {
    if (options.dealerPeak === true) {
        // If 10 or ace showing
        if (['A', 'K', 'Q', 'J', 'T'].includes(dealer[1][0])) {
            // If blackjack
            if (getTotal(dealer).length === 2 && getTotal(dealer)[1] === 21) {
                console.log('Red light');
                phase = 'dealer';
                dealersTurn();
            } else {
                console.log('Green light');
                insured = 0;
                drawGame();
                phase = 'player';
            }
        } else {
            phase = 'player';
        }
    } else {
        phase = 'player';
    }
    // Check for player blackjack
    const playerTotal = getTotal(hands[0]);
    if (phase === 'player' && playerTotal.length === 2 && playerTotal[1] === 21) {
        phase = 'dealer';
        dealersTurn();
    }
}

// Return total value of hand as an array with 1 or 2 values
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

// If it's the player's turn, hit
function hit() {
    if (phase === 'player') {
        hands[activeHand].push(shoe.pop());
        drawGame();
        const handTotal = getTotal(hands[activeHand]);
        // If hand busted, move to next hand, or move to dealer turn
        if (handTotal[0] > 21) {
            bets[activeHand] = 0;
            nextHand();
        }
        // If hand is 21, go to next hand, don't allow another hit
        else if ((handTotal.length === 1 && handTotal[0] === 21) || (handTotal.length === 2 && handTotal[1] === 21)) {
            nextHand();
        }
    }
}

// If player has more hands to play, move to next hand, otherwise start dealer's turn
function nextHand() {
    if (phase === 'player') {
        // If hand busted, take bet
        if (getTotal(hands[activeHand])[0] > 21) {
            bets[activeHand] = 0;
        }
        // If no more hands to play
        if (hands.length === activeHand + 1) {
            phase = 'dealer';
            drawGame();
            dealersTurn();
        }
        // If more hands to play
        else {
            // If player split and their next hand is 21
            const playerTotal = getTotal(hands[activeHand + 1]);
            if (playerTotal.length === 2 && playerTotal[1] === 21) {
                phase = 'dealer';
                drawGame();
                dealersTurn();
            }
            activeHand += 1;
            drawGame();
        }
    }
}

// Double bet and deal card
function double() {
    if (phase === 'player') {
        // If doubleAfterSplit isn't allowed and player already has more than one hand
        if (options.doubleAfterSplit === false && hands.length !== 1) {
            alert("You can't double after splitting. You can change this rule in the settings.")
        }
        else {
            if (hands[activeHand].length === 2) {
                if (cash >= bets[activeHand]) {
                    // Take cash
                    cash -= bets[activeHand];
                    // Double bet
                    bets[activeHand] = bets[activeHand] * 2;
                    // Deal card
                    hands[activeHand].push(shoe.pop());
                    nextHand();
                }
                else {
                    alert("You don't have enough chips to double your bet.")
                }
            }
            else {
                alert("You can only double 2-card hands.")
            }
        }
    }
}

// Split hand
function split() {
    if (phase === 'player') {
        // If the current hand has 2 cards and the values are the same
        if (hands[activeHand].length === 2 && 
        (hands[activeHand][0][0] === hands[activeHand][1][0] ||
        ((hands[activeHand][0][0] === 'T' || hands[activeHand][0][0] === 'J' ||
        hands[activeHand][0][0] === 'Q' || hands[activeHand][0][0] === 'K') &&
        (hands[activeHand][1][0] === 'T' || hands[activeHand][1][0] === 'J' ||
        hands[activeHand][1][0] === 'Q' || hands[activeHand][1][0] === 'K'))
        )) {
            if (hands.length === 4) {
                alert("You're only allowed to split 3 times for a total of 4 hands.");
            }
            else {
                if (cash >= bets[activeHand]) {
                    // Create a new hand with one of the cards
                    hands.splice(activeHand + 1, 0,[hands[activeHand][0]]);
                    hands[activeHand].shift();
                    // Add bet and subtract cash
                    bets.push(bets[activeHand]);
                    cash -= bets[activeHand];
                    drawGame();
                    // Deal 2 more cards
                    phase = 'animation';
                    setTimeout(() => {
                        hands[activeHand].push(shoe.pop());
                        drawGame();
                    }, options.dealerSpeed);
                    setTimeout(() => {
                        hands[activeHand + 1].push(shoe.pop());
                        phase = 'player';
                        drawGame();
                        // If aces were split and acesSplit1Card is on, start dealer's turn
                        if (options.splitAces1Card && hands[activeHand][0][0] === 'A') {
                            dealersTurn();
                            return;
                        }
                        // Check for 21
                        const playerTotal = getTotal(hands[activeHand]);
                        if (playerTotal.length === 2 && playerTotal[1] === 21) {
                            nextHand();
                        }
                    }, options.dealerSpeed * 2);
                }
                else {
                    alert("You don't have enough chips to split.")
                }
            }
        }
        else {
            alert('You can only split 2 cards of the same value.');
        }
    }
}

// Check if it's possible to surrender hand
function surrender() {
    if (phase === 'player') {
        if (options.surrender === 'notAllowed') {
            alert("Surrender isn't allowed. You can change this rule in the settings.");
        }
        else {
            if (hands.length === 1 && hands[0].length === 2) {
                if (options.surrender === 'nonAces') {
                    if (dealer[1][0] === 'A') {
                        alert("You can't surrender when the dealer's upcard is an Ace. You can change this rule in the settings.");
                    }
                    else {
                        paySurrender();
                    }
                }
                else if (options.surrender === 'allCards') {
                    paySurrender();
                }
            }
            else {
                alert("You can only surrender at the beginning of your turn.")
            }
        }
    }
}

// Surrender hand
function paySurrender() {
    // Give half of bet back (rounded down), set bet to half, next hand
    cash += Math.trunc(bets[activeHand] / 2);
    bets[activeHand] = Math.trunc(bets[activeHand] / 2);
    phase = 'bet';
    drawGame();
    drawBet();
}

// Dealer's turn
function dealersTurn() {
    // Check for dealer blackjack and pay insurance
    if (getTotal(dealer).length === 2 && getTotal(dealer)[1] === 21) {
        if (insured != 0) {
            // pay 2:1 insurance plus original insurance bet back
            cash += insured * 3;
            insured = insured * 3;
            drawGame();
        }
    }
    // Check for player blackjack
    if (hands.length === 1 && hands[0].length === 2 && getTotal(hands[0])[1] === 21) {
        processBets();
        return;
    }
    // Check if all player's hands busted
    let playerHandsBusted = true;
    for (let i = 0; i < bets.length; i++) {
        if (bets[i] != 0) {
            playerHandsBusted = false;
        }
    }
    if (!playerHandsBusted) {
        let dealerHand = [...dealer];

        function dealerHit() {
            let total = getTotal(dealerHand);
            if (total.length === 1) {
                // Hard hand logic
                if (total[0] >= 17) {
                    processBets();
                }
                else {
                    dealerHand.push(shoe.pop());
                    setTimeout(() => {
                        dealer.push(dealerHand[dealer.length]);
                        drawGame();
                        dealerHit();
                    }, options.dealerSpeed);
                }
            }
            else if (total.length === 2) {
                // Soft hand logic
                let softTotal = total[1];
                if (softTotal >= 18 || (softTotal === 17 && options.soft17 === 'stand')) {
                    processBets();
                }
                else {
                    dealerHand.push(shoe.pop());
                    setTimeout(() => {
                        dealer.push(dealerHand[dealer.length]);
                        drawGame();
                        dealerHit();
                    }, options.dealerSpeed);
                }
            }
        }
        dealerHit();
    }
    else {
        processBets();
    }
}

function processBets() {
    // Convert dealer total to one number
    let dealerTotal = getTotal(dealer);
    if (dealerTotal.length === 2) {
        dealerTotal = dealerTotal[1];
    } else {
        dealerTotal = dealerTotal[0];
    }
    // If dealer has blackjack, take all bets except for player blackjacks
    dealerBlackjack = false;
    if (dealerTotal === 21 && dealer.length === 2) {
        dealerBlackjack = true;
    }
    for (let hand = 0; hand < hands.length; hand++) {
        if (bets[hand] != 0) {
            // Convert hand total to one number
            let handTotal = getTotal(hands[hand]);
            if (handTotal.length === 2) {
                handTotal = handTotal[1];
            }
            else if (handTotal.length === 1) {
                handTotal = handTotal[0];
            }
            // If player has blackjack (and not 21 after splitting)
            if (handTotal === 21 && hands[hand].length === 2 && hands.length === 1) {
                if (dealerBlackjack) {
                    cash += bets[hand];
                }
                else {
                    cash += bets[hand] * 2.5;
                    bets[hand] = bets[hand] * 2.5;
                }
            }
            // If dealer has blackjack
            else if (dealerBlackjack) {
                bets[hand] = 0;
            }
            // If dealer busted
            else if (dealerTotal > 21) {
                cash += bets[hand] * 2;
                bets[hand] = bets[hand] * 2;
            }
            // If player busted
            else if (handTotal > 21) {
                bets[hand] = 0;
            }
            // Less than dealer
            else if (handTotal < dealerTotal) {
                bets[hand] = 0;
            }
            //Tied with dealer
            else if (handTotal === dealerTotal) {
                cash += bets[hand];
            }
            // Greater than dealer
            else if (handTotal > dealerTotal) {
                cash += bets[hand] * 2;
                bets[hand] = bets[hand] * 2;
            }
        } 
    }
    phase = 'bet';
    drawGame();
}
