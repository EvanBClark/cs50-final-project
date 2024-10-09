// Create global variables
let shoe = [];
let dealer = [];
let hands = [ [] ];
let bets = [];
let lastBet = null;
let cash = 1000;
let phase = 'bet'; // bet, player, dealer, animation
let activeHand = 0;
let insured = 0;

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
    dealerSpeed: 0, // in milliseconds
    hitKey: ' ',
    standKey: 'Enter',
    doubleKey: 'd',
    splitKey: 's',
    surrenderKey: 'u',
};

// Once HTML page has loaded execute main function
document.addEventListener('DOMContentLoaded', function() {  
    main();
});

// Main function
function main() {
    shoe = shuffle(options.numberOfDecks);
    drawGame();
    drawButtons();
    placeBet();
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
    // options.shoePenatration = 1;
    // decks = ['9d' ,'Ks', 'As', '5d', '8s', 'Jh', '8c', 'Ks', '8h', 'Ac', '8s', '7d', '8d'];
    return decks;
}

// Take bet
function placeBet() {
    // If shoe is getting low, reshuffle
    const shuffling = document.createElement('p');
    shuffling.id = 'shuffling'
    shuffling.innerHTML = 'Shuffling'
    if (shoe.length < options.numberOfDecks * 52 * (1 - options.shoePenatration)) {
        shoe = shuffle(options.numberOfDecks);
        document.getElementById('game').appendChild(shuffling);
    }
    // Create bet input field
    const input = document.createElement('input');
    input.id = 'betValue';
    input.type = 'number';
    input.min = 1;
    if (lastBet) {
        input.value = lastBet;
    }
    document.getElementById('game').appendChild(input);
    document.getElementById('betValue').focus();
    // Create Bet button
    const button = document.createElement('button');
    button.id = 'betButton';
    button.innerHTML = 'Bet';
    document.getElementById('game').appendChild(button);
    button.addEventListener('click', betClicked);
    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            betClicked();
        }
    })
}

function betClicked() {
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
            drawGame();
            // Deal hand
            phase = 'animation';
            dealHand();
        }
        else {
            alert('Not enough cash.')
        }
    }
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
                    phase = 'player';
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

function drawGame() {
    // Display current cash amount
    let c = document.getElementById('cash');
    if (!c) {
        c = document.createElement('p');
        c.id = 'cash';
        document.getElementById('game').appendChild(c);
    }  
    c.innerHTML = 'Cash: ' + cash;
    // Draw dealer's cards
    let d = document.getElementById('dealer');
    if (!d) {
        d = document.createElement('p');
        d.id = 'dealer';
        document.getElementById('game').appendChild(d);
    }
    if (phase === 'dealer' || phase === 'bet') {
        d.innerHTML = 'Dealer: ' + dealer
        if (options.showHandTotals) {
            d.innerHTML += ' Total: ' + getTotal(dealer);
        }
    }
    else {
        d.innerHTML = 'Dealer: ';
        for (let i = 0; i < dealer.length; i++) {
            if (i === 0) {
                d.innerHTML += 'XX,';
            }
            else {
                d.innerHTML += dealer[i];
            }
        }
    }
    // Draw player's cards
    let p = document.getElementById('player');
    if (!p) {
        p = document.createElement('p');
        p.id = 'player';
        document.getElementById('game').appendChild(p);
    }
    p.innerHTML = 'Player: ';
    for (let i = 0; i < hands.length; i++) {
        p.innerHTML += hands[i];
        if (options.showHandTotals) {
            p.innerHTML += ' Total: ' + getTotal(hands[i]);
        }
        p.innerHTML += ' Bet: ' + bets[i] + ' | ';
    }
    if (insured !== 0) {
        p.innerHTML += 'Insurance bet: ' + insured + ' | ';
    }
    p.innerHTML += 'Active Hand: ' + activeHand;
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

// Draw buttons
function drawButtons() {
    // Create hit button
    const hitButton = document.createElement('button');
    hitButton.innerHTML = 'Hit';
    document.getElementById('game').appendChild(hitButton);
    hitButton.addEventListener('click', hit);
    // Hit keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.hitKey) {
            hit();
        }
    });
    // Create stand button
    const standButton = document.createElement('button');
    standButton.innerHTML = 'Stand';
    document.getElementById('game').appendChild(standButton);
    standButton.addEventListener('click', nextHand);
    // Stand keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.standKey) {
            nextHand();
        }
    });
    // Create surrender button
    const surrenderButton = document.createElement('button');
    surrenderButton.innerHTML = 'Surrender';
    document.getElementById('game').appendChild(surrenderButton);
    surrenderButton.addEventListener('click', surrender);
    // Double keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.surrenderKey) {
            surrender();
        }
    });
    // Create double button
    const doubleButton = document.createElement('button');
    doubleButton.innerHTML = 'Double';
    document.getElementById('game').appendChild(doubleButton);
    doubleButton.addEventListener('click', double);
    // Double keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.doubleKey) {
            double();
        }
    });
    // Create split button
    const splitButton = document.createElement('button');
    splitButton.innerHTML = 'Split';
    document.getElementById('game').appendChild(splitButton);
    splitButton.addEventListener('click', split);
    // Split keyboard shortcut
    addEventListener('keypress', (event) => {
        if (event.key === options.splitKey) {
            split();
        }
    });
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
    placeBet();
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
    placeBet();
}
