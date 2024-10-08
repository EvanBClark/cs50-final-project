// Create global game variable
let game = {
    shoe: [],
    dealer: [],
    hands: [ [] ],
    bets: [],
    lastBet: null,
    cash: 1000,
    phase: 'bet', // bet, player, dealer
    activeHand: 0,
    insured: 0,
}

// Store all options in a global variable
let options = {
    numberOfDecks: 1,
    shoePenatration: .5, // percent of shoe dealer will deal before reshuffling
    soft17: 'hits', // hits, stands
    doubleAfterSplit: true,
    doubleVariation: '9,10,11', // 'allCards' or '9,10,11' // STILL NEED TO ADD
    surrender: 'allCards', // notAllowed, nonAces, allCards // Only supports late surrender
    dealerPeak: true,
    insurance: true,
    splitAces1Card: true,
    showHandTotals: true,
    dealerSpeed: 500, // in milliseconds
};

// Once HTML page has loaded execute main function
document.addEventListener('DOMContentLoaded', function() {  
    main();
});

// Main function
function main() {
    // Display current cash amount
    drawCash();
    // Shuffle cards
    game.shoe = shuffle(options.numberOfDecks);
    drawButtons();
    // Take bet
    placeBet();
}

// Display current cash amount
function drawCash() {
    let p = document.getElementById('cash');
    if (!p) {
        p = document.createElement('p');
        p.id = 'cash';
        document.getElementById('game').appendChild(p);
    }  
    p.innerHTML = 'Cash: ' + game.cash;
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
    // decks = ['9d' ,'Ks', 'As', '5d', 'Js', 'Ah', '7h', 'Ks', 'Qs', 'Ac', '5s', '7d', '4d']
    return decks;
}

// Take bet
function placeBet() {
    // If shoe is getting low, reshuffle
    const shuffling = document.createElement('p');
    shuffling.innerHTML = 'Shuffling'
    if (game.shoe.length < options.numberOfDecks * 52 * (1 - options.shoePenatration)) {
        game.shoe = shuffle(options.numberOfDecks);
        document.getElementById('game').appendChild(shuffling);
    }
    // Create bet input field
    const input = document.createElement('input');
    input.id = 'betValue';
    input.type = 'number';
    input.min = 1;
    if (game.lastBet) {
        input.value = game.lastBet;
    }
    document.getElementById('game').appendChild(input);
    document.getElementById('betValue').focus();
    // Create Bet button
    const button = document.createElement('button');
    button.innerHTML = 'Bet';
    document.getElementById('game').appendChild(button);
    // Create error message p tag
    const errorMessage = document.createElement('p');
    document.getElementById('game').appendChild(errorMessage);
    button.addEventListener('click', function() {
        // Get bet value and parseInt
        let betValue = document.getElementById('betValue').value;
        betValue = parseInt(betValue);
        // Check to make sure bet is valid
        if (Number.isInteger(betValue) && betValue > 0) {
            if (betValue <= game.cash) {
                // Clean up last hand data
                game.dealer = [];
                game.hands = [ [] ];
                game.activeHand = 0;
                game.insured = 0;
                // Set bet
                game.bets = [betValue];
                // Save bet for next hand
                game.lastBet = betValue;
                // Remove text field and button
                input.remove();
                button.remove();
                errorMessage.remove();
                shuffling.remove();
                // Remove cash
                game.cash -= betValue;
                drawCash();
                // Deal hand
                game.phase = 'player';
                dealHand();
            }
            else {
                errorMessage.innerHTML = 'Not enough Cash';
            }
        }
    });
}

// Deal hand
function dealHand() {
    // Deal 2 cards to the dealer and player
    for (let i = 0; i < 2; i++) {
        setTimeout(() => {
            game.hands[0].push(game.shoe.pop());
            drawCards();
        }, i * options.dealerSpeed * 2);
        setTimeout(() => {
            game.dealer.push(game.shoe.pop());
            drawCards();
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
    if (options.insurance && game.dealer[1][0] === 'A') {
        setTimeout(() => {
            if (confirm('Would you like insurance?')) {
                if (game.cash >= Math.trunc(game.bets[game.activeHand] / 2)) {
                    game.insured = Math.trunc(game.bets[game.activeHand] / 2);
                    game.cash -= Math.trunc(game.bets[game.activeHand] / 2);
                    drawCash();
                    drawCards();
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
        if (['A', 'K', 'Q', 'J', 'T'].includes(game.dealer[1][0])) {
            // If blackjack
            if (getTotal(game.dealer).length === 2 && getTotal(game.dealer)[1] === 21) {
                console.log('Red light');
                game.phase = 'dealer';
                dealersTurn();
            } else {
                console.log('Green light');
                game.insured = 0;
                drawCards();
                game.phase = 'player';
            }
        } else {
            game.phase = 'player';
        }
    } else {
        game.phase = 'player';
    }
    // Check for player blackjack
    const playerTotal = getTotal(game.hands[0]);
    if (game.phase === 'player' && playerTotal.length === 2 && playerTotal[1] === 21) {
        game.phase = 'dealer';
        dealersTurn();
    }
}

function drawCards() {
    // Draw dealer's cards
    let d = document.getElementById('dealer');
    if (!d) {
        d = document.createElement('p');
        d.id = 'dealer';
        document.getElementById('game').appendChild(d);
    }
    if (game.phase === 'dealer' || game.phase === 'bet') {
        d.innerHTML = 'Dealer: ' + game.dealer + ' Total: ' + getTotal(game.dealer);
    }
    else {
        d.innerHTML = 'Dealer: ';
        for (let i = 0; i < game.dealer.length; i++) {
            if (i === 0) {
                d.innerHTML += 'XX,';
            }
            else {
                d.innerHTML += game.dealer[i];
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
    for (let i = 0; i < game.hands.length; i++) {
        p.innerHTML += game.hands[i];
        p.innerHTML += ' Total: ' + getTotal(game.hands[i])
        p.innerHTML += ' Bet: ' + game.bets[i] + ' | '
    }
    if (game.insured !== 0) {
        p.innerHTML += 'Insurance bet: ' + game.insured + ' | '
    }
    p.innerHTML += 'Active Hand: ' + game.activeHand;
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
    // Create stand button
    const standButton = document.createElement('button');
    standButton.innerHTML = 'Stand';
    document.getElementById('game').appendChild(standButton);
    standButton.addEventListener('click', nextHand);
    // Create surrender button
    const surrenderButton = document.createElement('button');
    surrenderButton.innerHTML = 'Surrender';
    document.getElementById('game').appendChild(surrenderButton);
    surrenderButton.addEventListener('click', surrender);
    // Create double button
    const doubleButton = document.createElement('button');
    doubleButton.innerHTML = 'Double';
    document.getElementById('game').appendChild(doubleButton);
    doubleButton.addEventListener('click', double);
    // Create split button
    const splitButton = document.createElement('button');
    splitButton.innerHTML = 'Split';
    document.getElementById('game').appendChild(splitButton);
    splitButton.addEventListener('click', split);
}

// If it's the player's turn, hit
function hit() {
    if (game.phase === 'player') {
        game.hands[game.activeHand].push(game.shoe.pop());
        drawCards();
        const handTotal = getTotal(game.hands[game.activeHand]);
        // If hand busted, move to next hand, or move to dealer turn
        if (handTotal[0] > 21) {
            game.bets[game.activeHand] = 0;
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
    if (game.phase === 'player') {
        // If hand busted, take bet
        if (getTotal(game.hands[game.activeHand])[0] > 21) {
            game.bets[game.activeHand] = 0;
        }
        // If no more hands to play
        if (game.hands.length === game.activeHand + 1) {
            game.phase = 'dealer';
            drawCash();
            drawCards();
            dealersTurn();
        }
        // If more hands to play
        else {
            // If player split and their next hand is 21
            const playerTotal = getTotal(game.hands[game.activeHand + 1]);
            if (playerTotal.length === 2 && playerTotal[1] === 21) {
                game.phase = 'dealer';
                drawCash();
                drawCards();
                dealersTurn();
            }
            game.activeHand += 1;
            drawCash();
            drawCards();
        }
    }
}

// Double bet and deal card
function double() {
    if (game.phase === 'player') {
        if (game.hands[game.activeHand].length === 2) {
            if (game.cash >= game.bets[game.activeHand]) {
                // Take cash
                game.cash -= game.bets[game.activeHand];
                // Double bet
                game.bets[game.activeHand] = game.bets[game.activeHand] * 2;
                // Deal card
                game.hands[game.activeHand].push(game.shoe.pop());
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

// Split hand
function split() {
    if (game.phase === 'player') {
        // If the current hand has 2 cards and the values are the same
        if (game.hands[game.activeHand].length === 2 && 
        (game.hands[game.activeHand][0][0] === game.hands[game.activeHand][1][0] ||
        ((game.hands[game.activeHand][0][0] === 'T' || game.hands[game.activeHand][0][0] === 'J' ||
        game.hands[game.activeHand][0][0] === 'Q' || game.hands[game.activeHand][0][0] === 'K') &&
        (game.hands[game.activeHand][1][0] === 'T' || game.hands[game.activeHand][1][0] === 'J' ||
        game.hands[game.activeHand][1][0] === 'Q' || game.hands[game.activeHand][1][0] === 'K'))
        )) {
            if (game.hands.length === 4) {
                alert("You're only allowed to split 3 times for a total of 4 hands.");
            }
            else {
                if (game.cash >= game.bets[game.activeHand]) {
                    // Create a new hand with with one of the cards
                    game.hands.push([game.hands[game.activeHand][0]]);
                    game.hands[game.activeHand].shift();
                    // Add bet and subtract cash
                    game.bets.push(game.bets[game.activeHand]);
                    game.cash -= game.bets[game.activeHand];
                    drawCash();
                    drawCards();
                    // Deal 2 more cards
                    setTimeout(() => {
                        game.hands[game.activeHand].push(game.shoe.pop());
                        drawCards();
                    }, options.dealerSpeed);
                    setTimeout(() => {
                        game.hands[game.activeHand + 1].push(game.shoe.pop());
                        drawCards();
                        // If aces were split and acesSplit1Card is on, start dealer's turn
                        if (game.splitAces1Card && game.hands[game.activeHand][0][0] === 'A') {
                            dealersTurn();
                            return;
                        }
                        // Check for 21
                        const playerTotal = getTotal(game.hands[game.activeHand]);
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
    if (game.phase === 'player') {
        if (options.surrender === 'notAllowed') {
            alert("Surrender isn't allowed. You can change this rule in the settings.");
        }
        else if (options.surrender === 'nonAces') {
            if (game.dealer[1][0] === 'A') {
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
}

// Surrender hand
function paySurrender() {
    // Give half of bet back (rounded down), set bet to 0, next hand
    game.cash += Math.trunc(game.bets[game.activeHand] / 2);
    game.bets[game.activeHand] = 0;
    nextHand();
}

// Dealer's turn
function dealersTurn() {
    // Check for dealer blackjack and pay insurance
    if (getTotal(game.dealer).length === 2 && getTotal(game.dealer)[1] === 21) {
        if (game.insured != 0) {
            // pay 2:1 insurance plus original insurance bet back
            game.cash += game.insured * 3;
            game.insured = game.insured * 3;
            drawCards();
        }
    }
    // Check for player blackjack
    if (game.hands.length === 1 && game.hands[0].length === 2 && getTotal(game.hands[0])[1] === 21) {
        processBets();
        return;
    }
    // Check if all player's hands busted
    let playerHandsBusted = true;
    for (let i = 0; i < game.bets.length; i++) {
        if (game.bets[i] != 0) {
            playerHandsBusted = false;
        }
    }
    if (!playerHandsBusted) {
        let dealerHand = [...game.dealer];

        function dealerHit() {
            let total = getTotal(dealerHand);
            if (total.length === 1) {
                // Hard hand logic
                if (total[0] >= 17) {
                    processBets();
                }
                else {
                    dealerHand.push(game.shoe.pop());
                    setTimeout(() => {
                        game.dealer.push(dealerHand[game.dealer.length]);
                        drawCards();
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
                    dealerHand.push(game.shoe.pop());
                    setTimeout(() => {
                        game.dealer.push(dealerHand[game.dealer.length]);
                        drawCards();
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
    let dealerTotal = getTotal(game.dealer);
    if (dealerTotal.length === 2) {
        dealerTotal = dealerTotal[1];
    } else {
        dealerTotal = dealerTotal[0];
    }
    // If dealer has blackjack, take all bets except for player blackjacks
    dealerBlackjack = false;
    if (dealerTotal === 21 && game.dealer.length === 2) {
        dealerBlackjack = true;
    }
    for (let hand = 0; hand < game.hands.length; hand++) {
        if (game.bets[hand] != 0) {
            // Convert hand total to one number
            let handTotal = getTotal(game.hands[hand]);
            if (handTotal.length === 2) {
                handTotal = handTotal[1];
            }
            else if (handTotal.length === 1) {
                handTotal = handTotal[0];
            }
            // If player has blackjack (and not 21 after splitting)
            if (handTotal === 21 && game.hands[hand].length === 2 && game.hands.length === 1) {
                if (dealerBlackjack) {
                    game.cash += game.bets[hand];
                }
                else {
                    game.cash += game.bets[hand] * 2.5;
                    game.bets[hand] = game.bets[hand] * 2.5;
                }
            }
            // If dealer has blackjack
            else if (dealerBlackjack) {
                game.bets[hand] = 0;
            }
            // If dealer busted
            else if (dealerTotal > 21) {
                game.cash += game.bets[hand] * 2;
                game.bets[hand] = game.bets[hand] * 2;
            }
            // If player busted
            else if (handTotal > 21) {
                game.bets[hand] = 0;
            }
            // Less than dealer
            else if (handTotal < dealerTotal) {
                game.bets[hand] = 0;
            }
            //Tied with dealer
            else if (handTotal === dealerTotal) {
                game.cash += game.bets[hand];
            }
            // Greater than dealer
            else if (handTotal > dealerTotal) {
                game.cash += game.bets[hand] * 2;
                game.bets[hand] = game.bets[hand] * 2;
            }
        } 
    }
    game.phase = 'bet';
    drawCash();
    drawCards();
    placeBet();
}
