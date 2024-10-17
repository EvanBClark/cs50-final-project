// Create global variables
let shoe = [];
let dealer = [];
let hands = [ [] ];
let bets = [];
let lastBet = null;
let cash = 100;
let phase = 'bet'; // bet, player, dealer, animation, settings
let activeHand = 0;
let insured = 0;
let images = {};
let dataUrls = {};
let settingsMenu = false;

// Define default options
const defaultOptions = {
    showHandTotals: true,
    dealerSpeed: 500, // in milliseconds
    numberOfDecks: 6,
    shoePenetration: .75,
    soft17: 'hits', // hits, stands
    doubleAfterSplit: true,
    splitAces1Card: true,
    //doubleVariation: 'All Cards', // 'All Cards' or '9,10, or 11' // STILL NEED TO ADD
    surrender: 'Not Allowed', // Not Allowed, Non-Aces, All Cards
    dealerPeak: true,
    insurance: false,
    buyIn: null,
    hitKey: ' ',
    standKey: 'Enter',
    doubleKey: 'd',
    splitKey: 's',
    surrenderKey: 'u',
};

// Store all options in a global variable
let options = structuredClone(defaultOptions);
let tempOptions = structuredClone(options);

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
        if (event.key === options.hitKey && !settingsMenu) {
            hit();
        }
    });
    // Stand keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.standKey && !settingsMenu) {
            nextHand();
        }
    });
    // Double keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.doubleKey && !settingsMenu) {
            double();
        }
    });
    // Split keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.splitKey && !settingsMenu) {
            split();
        }
    });
    // Surrender keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.surrenderKey && !settingsMenu) {
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
    const otherFileNames = ['whiteX', 'chips', 'settings', 'red'];
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

function drawSettings(gameSize, iconSize, iconMargin) {
    // Draw Settings title
    document.getElementById('game').innerHTML = '';
    title = document.createElement('span');
    title.innerHTML = 'Settings';
    title.style.fontSize = (gameSize / 15) + 'px';
    document.getElementById('game').appendChild(title);

    // Draw white X close button
    const whiteX = document.createElement('img');
    whiteX.src = dataUrls['whiteX'];
    whiteX.id = 'whiteX';
    whiteX.height = iconSize;
    whiteX.style.position = 'absolute';
    whiteX.style.top = (gameSize / 150) + 'px';
    whiteX.style.right = iconMargin + 'px';
    whiteX.addEventListener('click', closeSettings);
    document.getElementById('game').appendChild(whiteX);

    // Draw buy in chips
    const buyIn = drawTextInput(iconSize, 'buyIn', ' Buy in (add chips)');
    document.getElementById('game').appendChild(buyIn);
    document.getElementById('buyIn').value = tempOptions.buyIn;
    buyIn.addEventListener("input", (event) => {
        tempOptions.buyIn = event.target.value;
    });

    // Draw showHandTotals option
    const showHandTotals = drawCheckbox(iconSize, tempOptions.showHandTotals, 'showHandTotals', ' Show hand totals');
    document.getElementById('game').appendChild(showHandTotals);
    showHandTotals.addEventListener('click', function() {
        if (document.getElementById('checkboxshowHandTotals').checked) {
            tempOptions.showHandTotals = true;
        }
        else {
            tempOptions.showHandTotals = false;
        }
    })

    // Draw dealerSpeed option
    const dealerSpeed = drawTextInput(iconSize, 'dealerSpeed', ' Dealer speed in ms');
    document.getElementById('game').appendChild(dealerSpeed);
    document.getElementById('dealerSpeed').value = tempOptions.dealerSpeed;
    dealerSpeed.addEventListener("input", (event) => {
        tempOptions.dealerSpeed = event.target.value;
    });

    // Draw numberOfDecks option
    const numberOfDecks = drawTextInput(iconSize, 'numberOfDecks', ' Number of decks');
    document.getElementById('game').appendChild(numberOfDecks);
    document.getElementById('numberOfDecks').value = tempOptions.numberOfDecks;
    numberOfDecks.addEventListener("input", (event) => {
        tempOptions.numberOfDecks = event.target.value;
    });

    // Draw shoePenetration option
    const shoePenetration = drawTextInput(iconSize, 'shoePenetration', '% Shoe penetration for reshuffle');
    document.getElementById('game').appendChild(shoePenetration);
    document.getElementById('shoePenetration').value = tempOptions.shoePenetration * 100;
    shoePenetration.addEventListener("input", (event) => {
        tempOptions.shoePenetration = event.target.value;
    });

    // Draw soft17 option
    const soft17 = drawCheckbox(iconSize, tempOptions.soft17, 'soft17', ' Dealer hits on soft 17');
    document.getElementById('game').appendChild(soft17);
    soft17.addEventListener('click', function() {
        if (document.getElementById('checkboxsoft17').checked) {
            tempOptions.soft17 = 'hits';
        }
        else {
            tempOptions.soft17 = 'stands';
        }
    })

    // Draw dealerPeak option
    const dealerPeak = drawCheckbox(iconSize, tempOptions.dealerPeak, 'dealerPeak', ' Dealer peaks for blackjack');
    document.getElementById('game').appendChild(dealerPeak);
    dealerPeak.addEventListener('click', function() {
        if (document.getElementById('checkboxdealerPeak').checked) {
            tempOptions.dealerPeak = true;
        }
        else {
            tempOptions.dealerPeak = false;
        }
    })

    // Draw doubleAfterSplit option
    const doubleAfterSplit = drawCheckbox(iconSize, tempOptions.doubleAfterSplit, 'doubleAfterSplit', ' Double after split');
    document.getElementById('game').appendChild(doubleAfterSplit);
    doubleAfterSplit.addEventListener('click', function() {
        if (document.getElementById('checkboxdoubleAfterSplit').checked) {
            tempOptions.doubleAfterSplit = true;
        }
        else {
            tempOptions.doubleAfterSplit = false;
        }
    })

    // Draw splitAces1Card option
    const splitAces1Card = drawCheckbox(iconSize, tempOptions.splitAces1Card, 'splitAces1Card', ' Split aces get 1 card each');
    document.getElementById('game').appendChild(splitAces1Card);
    splitAces1Card.addEventListener('click', function() {
        if (document.getElementById('checkboxsplitAces1Card').checked) {
            tempOptions.splitAces1Card = true;
        }
        else {
            tempOptions.splitAces1Card = false;
        }
    })

    // Draw surrender option
    const surrender = drawSelect(iconSize, 'surrender', ' Late Surrender', ['Not Allowed', 'Non-Aces', 'All Cards']);
    document.getElementById('game').appendChild(surrender);
    document.getElementById('surrender').value = tempOptions.surrender;
    surrender.addEventListener("change", (event) => {
        tempOptions.surrender = event.target.value;
    });

    // Draw insurance option
    const insurance = drawCheckbox(iconSize, tempOptions.insurance, 'insurance', ' Offer insurance');
    document.getElementById('game').appendChild(insurance);
    insurance.addEventListener('click', function() {
        if (document.getElementById('checkboxinsurance').checked) {
            tempOptions.insurance = true;
        }
        else {
            tempOptions.insurance = false;
        }
    })

    // Draw buttonsDiv
    const buttonsDiv = document.createElement('div');
    document.getElementById('game').appendChild(buttonsDiv);

    // Define button properties
    const buttonHeight = iconSize + 'px';
    const buttonWidth = iconSize * 3 + 'px';
    const buttonFontSize = iconSize * .7 + 'px';
    const buttonBorderRadius = iconSize / 5 + 'px';
    const buttonMargin = iconSize / 10 +'px';

    // Draw buttons
    const saveButton = drawButton('saveButton', 'Save', buttonHeight, buttonWidth, buttonFontSize, buttonBorderRadius, buttonMargin);
    saveButton.addEventListener('click', saveSettings);
    buttonsDiv.appendChild(saveButton);
    const closeButton = drawButton('closeButton', 'Cancel', buttonHeight, buttonWidth, buttonFontSize, buttonBorderRadius, buttonMargin);
    closeButton.addEventListener('click', closeSettings);
    buttonsDiv.appendChild(closeButton);
}

function drawCheckbox(iconSize, option, id, labelText) {
    const p = document.createElement('p');
    p.style.margin = iconSize / 8 + 'px';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'checkbox' + id;
    checkbox.style.height = iconSize / 2 + 'px';
    checkbox.style.width = iconSize / 2 + 'px';
    if (option) {
        checkbox.checked = true;
    }
    else {
        checkbox.checked = false;
    }
    p.appendChild(checkbox);
    const label = document.createElement('label');
    label.for = id;
    label.innerHTML = labelText;
    label.style.fontSize = iconSize / 1.5 +'px';
    p.appendChild(label);
    return p;
}

function drawTextInput(iconSize, id, labelText) {
    const p = document.createElement('p');
    p.style.margin = iconSize / 8 + 'px';
    const textInput = document.createElement('input');
    textInput.id = id;
    textInput.style.height = iconSize / 1.5 + 'px';
    textInput.style.width = iconSize * 1.5 + 'px';
    textInput.style.fontSize = iconSize / 1.5 + 'px';
    p.appendChild(textInput);
    const label = document.createElement('label');
    label.for = id;
    label.innerHTML = labelText;
    label.style.fontSize = iconSize / 1.5 +'px';
    p.appendChild(label);
    return p;
}

function drawSelect(iconSize, id, labelText, selectOptions) {
    const p = document.createElement('p');
    p.style.margin = iconSize / 8 + 'px';
    const select = document.createElement('select');
    select.id = id;
    select.style.height = iconSize / 1.5 + 'px';
    select.style.fontSize = iconSize / 1.8 + 'px';
    p.appendChild(select);
    for (let i = 0; i < selectOptions.length; i++) {
        const option = document.createElement('option');
        option.value = selectOptions[i];
        option.innerHTML = selectOptions[i];
        select.appendChild(option);
    }
    const label = document.createElement('label');
    label.for = id;
    label.innerHTML = labelText;
    label.style.fontSize = iconSize / 1.5 +'px';
    p.appendChild(label);
    return p;
}

function closeSettings() {
    if (JSON.stringify(options) === JSON.stringify(tempOptions)) {
        settingsMenu = false;
        drawGame();
    }
    else {
        if (confirm('Are you sure you want to close the settings page? Your changes will not be saved.')) {
            settingsMenu = false;
            drawGame();
        }
    }
}

function saveSettings() {
    // Check dealerSpeed input
    if (tempOptions.dealerSpeed !== options.dealerSpeed) {
        if (isNaN(tempOptions.dealerSpeed)) {
            tempOptions.dealerSpeed = options.dealerSpeed;
        }
        else {
            tempOptions.dealerSpeed = Number(tempOptions.dealerSpeed);
        }
        if (tempOptions.dealerSpeed < 0) {
            tempOptions.dealerSpeed = 0;
        }
    }
    // Check numberOfDecks input
    if (tempOptions.numberOfDecks !== options.numberOfDecks) {
        if (isNaN(tempOptions.numberOfDecks)) {
            tempOptions.numberOfDecks = options.numberOfDecks;
        }
        else {
            tempOptions.numberOfDecks = parseInt(tempOptions.numberOfDecks);
        }
        if (tempOptions.numberOfDecks < 1) {
            tempOptions.numberOfDecks = 1;
        }
        shoe = shuffle(tempOptions.numberOfDecks);
    }
    // Check shoePenetration input and convert to decimal percentage
    if (tempOptions.shoePenetration !== options.shoePenetration) {
        if (isNaN(tempOptions.shoePenetration)) {
            tempOptions.shoePenetration = options.shoePenetration;
        }
        else {
            tempOptions.shoePenetration = Number(tempOptions.shoePenetration);
        }
        if (tempOptions.shoePenetration < 0) {
            tempOptions.shoePenetration = 0;
        }
        if (tempOptions.shoePenetration > 100) {
            tempOptions.shoePenetration = 100;
        }
        tempOptions.shoePenetration = tempOptions.shoePenetration / 100;
    }
    // Buy in chips
    if (!isNaN(tempOptions.buyIn) && tempOptions.buyIn !== null) {
        cash += parseInt(tempOptions.buyIn);
    }
    tempOptions.buyIn = null;
    options = structuredClone(tempOptions);
    settingsMenu = false;
    drawGame();
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
    if (window.visualViewport.width >= window.visualViewport.height) {
        gameSize = window.visualViewport.height;
    } else {
        gameSize = window.visualViewport.width;
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
    // If settings menu is open
    if (settingsMenu) {
        drawSettings(gameSize, iconSize, iconMargin);
    }
    else {
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
    chipsValue = document.createElement('span');
    chipsValue.id = 'chipsValue';
    chipsValue.style.fontSize = iconSize + 'px';
    chipsValue.style.position = 'absolute';
    chipsValue.style.left = (iconMargin + iconSize) + 'px';
    headerDiv.appendChild(chipsValue);
    chipsValue.innerHTML = cash;

    // Draw dealer lights
    if (options.dealerPeak) {
        // Background
        const lightsDiv = document.createElement('div');
        lightsDiv.style.height = iconSize + 'px';
        lightsDiv.style.width = iconSize * 1.5 + 'px';
        lightsDiv.style.backgroundColor = 'rgb(40, 40, 40)';
        lightsDiv.style.position = 'absolute';
        lightsDiv.style.left = gameSize / 4 + 'px';
        lightsDiv.style.top = iconMargin / 2 + 'px';
        headerDiv.appendChild(lightsDiv);

        // Green Light
        const greenLight = document.createElement('div');
        greenLight.id = 'greenLight';
        greenLight.style.width = iconMargin * 3.6 + 'px';
        greenLight.style.height = iconMargin * 3.6 + 'px';
        greenLight.style.position = 'absolute';
        greenLight.style.top = (iconSize - iconMargin * 3.6) / 2 + 'px';
        greenLight.style.left = iconSize / 4 + 'px';
        greenLight.style.backgroundColor = 'darkgreen';
        greenLight.style.borderRadius = '50%';
        lightsDiv.appendChild(greenLight);

        // Red Light
        const redLight = document.createElement('div');
        redLight.id = 'redLight';
        redLight.style.width = iconMargin * 3.6 + 'px';
        redLight.style.height = iconMargin * 3.6 + 'px';
        redLight.style.position = 'absolute';
        redLight.style.top = (iconSize - iconMargin * 3.6) / 2 + 'px';
        redLight.style.right = iconSize / 4 + 'px';
        if (dealer.length === 2 && getTotal(dealer).length === 2 && getTotal(dealer)[1] === 21) {
            redLight.style.backgroundColor = 'red';
        }
        else {
            redLight.style.backgroundColor = 'darkred';
        }
        redLight.style.borderRadius = '50%';
        lightsDiv.appendChild(redLight);
    }

    // Draw shoe
    const canvas = document.createElement('canvas');
    canvas.height = iconSize;
    canvas.width = iconSize * 4;
    canvas.style.backgroundColor = 'rgb(40, 40, 40)';
    canvas.style.position = 'absolute';
    canvas.style.right = iconSize + iconMargin * 3.5 + 'px';
    canvas.style.top = iconMargin / 2 + 'px';
    headerDiv.appendChild(canvas);
    const shoePercent = shoe.length / (options.numberOfDecks * 52);
    const context = canvas.getContext("2d");
    context.fillStyle = 'rgb(230, 230, 230)';
    context.fillRect(iconMargin, iconMargin, (canvas.width - (iconMargin * 2)) * shoePercent, canvas.height - (iconMargin * 2));
    const lineX = (canvas.width - (iconMargin * 2)) * (1 - options.shoePenetration) + iconMargin;
    context.beginPath();
    context.moveTo(lineX, iconMargin);
    context.lineTo(lineX, iconSize - iconMargin);
    context.strokeStyle = 'red';
    context.lineWidth = iconMargin;
    context.stroke();
    // Draw settings icon
    images['settings'].id = 'settingsIcon';
    images['settings'].height = iconSize;
    images['settings'].style.position = 'absolute';
    images['settings'].style.top = (gameSize / 150) + 'px';
    images['settings'].style.right = iconMargin + 'px';
    images['settings'].addEventListener('click', function() {
        // Save options in tempOptions
        tempOptions = structuredClone(options);
        settingsMenu = true;
        drawSettings(gameSize, iconSize, iconMargin);
    });
    headerDiv.appendChild(images['settings']);
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
        dealerTotal.innerHTML = formatDealerTotal(getTotal(dealer));
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

function formatDealerTotal(total) {
    if (total.length === 2) {
        total = total[1];
    }
    return total;
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
            handTotal.innerHTML = formatPlayerTotal(getTotal(hands[hand]));
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

function formatPlayerTotal(total) {
    if (total.length === 2) {
        if (total[1] === 21) {
            total = 21;
        }
        else {
            total = total[0] + '/' + total[1];
        }
    }
    return total;
}

// Take bet
function drawBet(gameSize, iconSize) {
    // If shoe is getting low, reshuffle
    const shuffling = document.createElement('p');
    shuffling.id = 'shuffling';
    shuffling.innerHTML = 'Shuffling';
    shuffling.style.fontSize = iconSize / 1.5 + 'px';
    shuffling.style.position = 'absolute';
    shuffling.style.bottom = iconSize * 1.6 + 'px';
    if (shoe.length < options.numberOfDecks * 52 * (1 - options.shoePenetration)) {
        shoe = shuffle(options.numberOfDecks);
        document.getElementById('game').appendChild(shuffling);
        shufflingWidth = shuffling.getBoundingClientRect().width;
        shuffling.style.left = (gameSize / 2 - shufflingWidth / 2) + 'px';
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
    document.getElementById('betValue').select();


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
    // Define button properties
    const buttonHeight = iconSize + 'px';
    const buttonWidth = iconSize * 5 + 'px';
    const buttonFontSize = iconSize * .7 + 'px';
    const buttonBorderRadius = iconSize / 5 + 'px';
    const buttonMargin = iconSize / 20 +'px';
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
    const hitButton = drawButton('hitButton', 'Hit', buttonHeight, buttonWidth, buttonFontSize, buttonBorderRadius, buttonMargin);
    topButtonsDiv.appendChild(hitButton);
    hitButton.addEventListener('click', hit);
    // Create stand button
    const standButton = drawButton('standButton', 'Stand', buttonHeight, buttonWidth, buttonFontSize, buttonBorderRadius, buttonMargin);
    topButtonsDiv.appendChild(standButton);
    standButton.addEventListener('click', nextHand);
    // Create double button
    const doubleButton = drawButton('doubleButton', 'Double', buttonHeight, buttonWidth, buttonFontSize, buttonBorderRadius, buttonMargin);
    bottomButtonsDiv.appendChild(doubleButton);
    doubleButton.addEventListener('click', double);
    // Create split button
    const splitButton = drawButton('splitButton', 'Split', buttonHeight, buttonWidth, buttonFontSize, buttonBorderRadius, buttonMargin);
    bottomButtonsDiv.appendChild(splitButton);
    splitButton.addEventListener('click', split);
    // If surrender isn't allowed
    if (options.surrender !== 'Not Allowed') {
        // Create surrender button
        const surrenderButton = drawButton('surrenderButton', 'Surrender', buttonHeight, buttonWidth, buttonFontSize, buttonBorderRadius, buttonMargin);
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

function drawButton(id, innerHTML, height, width, fontSize, borderRadius, margin) {
    const button = document.createElement('button');
    button.id = id;
    button.innerHTML = innerHTML;
    button.style.height = height;
    button.style.width = width;
    button.style.fontSize = fontSize;
    button.style.borderRadius = borderRadius;
    button.style.margin = margin;
    return button;
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
            alert('Not enough cash. You can add more in the settings.')
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
    // decks = ['3h', '2s', '5h', '5c', '3h', '4s', '6h', '3s', '2d' ,'4s', 'As', '5d', '3s', '4h', '8c', '2s', '8h', 'Kh', '8s', '7h', '8d'];
    // decks = ['3h', '2s', '5h', '5c', '3h', '4s', '6h', '3s', '2d', '3h', '2s', '5h', '8c', 'Ah', 'Ks', 'Jh', '5s']
    // options.shoePenetration = 1;
    return decks;
}

// Deal hand
function dealHand() {
    // Check if shoe is too low to deal hand
    if (shoe.length <= 4) {
        alert('There are less than 5 cards left in the shoe. Lower the shoe penetration in the settings to avoid this problem.')
        phase = 'bet';
        lastBet = null;
        cash += bets[0];
        drawGame();
        return;
    }
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
                phase = 'dealer';
                dealersTurn();
            } else {
                insured = 0;
                drawGame();
                document.getElementById('greenLight').style.backgroundColor = 'rgb(0, 255, 0)';
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
        // Check if shoe is empty
        if (shoe.length === 0) {
            alert('There are no more cards left in the shoe. Lower the shoe penetration in the settings to avoid this problem.')
            phase = 'bet';
            drawGame();
            return;
        }
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
        if (options.surrender === 'Not Allowed') {
            alert("Surrender isn't allowed. You can change this rule in the settings.");
        }
        else {
            if (hands.length === 1 && hands[0].length === 2) {
                if (options.surrender === 'Non-Aces') {
                    if (dealer[1][0] === 'A') {
                        alert("You can't surrender when the dealer's upcard is an Ace. You can change this rule in the settings.");
                    }
                    else {
                        paySurrender();
                    }
                }
                else if (options.surrender === 'All Cards') {
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
            // Check if shoe is empty
            if (shoe.length === 0) {
                alert('There are no more cards left in the shoe. Lower the shoe penetration in the settings to avoid this problem.')
                phase = 'bet';
                drawGame();
                return;
            }
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
