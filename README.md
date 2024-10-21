# Blackjack
#### Video Demo:  <URL HERE>
#### Link: <URL HERE>
## Description
This is a blackjack game with many different rule variations that you can change in the settings. It was written mostly in Javascript. It uses an AWS server running Python using the Flask framework.

I had hoped to implement more features. I wanted to add a blackjack basic strategy checker that alerts you if you don't play the most advantageous move. I had also hoped to add a login feature to store the user's settings on a server. That's why I started with Python and Flask. I hope to add these features in the future. This project already took a lot longer than I had expected.

The game shows you many chips you have in the top left corner. Then there's the lights that light up when the dealer peeks for blackjack. The white bar is a representation of the shoe filled with cards. Then there's the gear icon which opens the settings menu. You'll first be asked to make a bet. Then cards are dealt and the totals of the hands are optionally displayed above the hands.

This game is currently only supported on devices without soft keyboards (PC, Mac). I had hoped to make it mobile friendly too, but ran into some issues with the soft keyboards. The password manager bar that pops up above the soft keyboard on Chrome gave me the most issues. Hopefully I can get it working on mobile one day, or maybe it just needs to be a native app.

## How to Play
In Blackjack, your goal is to get as close to 21 without going over. Face cards are equal to 10, Aces can be 1 or 11, and cards 2-10 have their respective value. For each hand, you have 4 or 5 choices, hit, stand, double, split, and sometimes surrender. When you hit, you'll receive one more card. When you stand, then it moves to either the dealer's turn, or the player’s next hand if you have more hands to play. When you double, your bet doubles and you only receive one more card. You can only split when you have two of the same value cards. You must double your bet, then those cards each create a new hand and receive one card each.

## Options
In the settings menu, you can buy in, which adds more chips to your stack. You can also change any of these settings:
- Show hand totals: This changes whether the total value of your hand and the dealer's hand is displayed above the cards.
- Dealer speed in ms: This changes the delay between cards being dealt. Change this to 0 if you want the fastest game possible.
- Number of decks: Changes how many decks are shuffled into the shoe.
- % Shoe Penetration: This sets what percentage of the shoe is dealt before reshuffling. This is usually around 75% for a 6 deck game and around 50%, or even less, for a one deck game.
- Dealer hits on soft 17: When a dealer has an Ace that could be 1 or 11 and they have a total of 7 or 17, they can either hit or stand. This rule varies by table. In America, it's common to have the dealer hit, but in Europe, it's more common for them to stand.
- Dealer peeks for blackjack: This changes whether the dealer will "peak" for a blackjack before the player's turn. On some tables, the dealer will actually lift up the cards and peak, but it's more common to use a green light/red light mechanical system.
- Double after split: If this option is turned off, the player won't be able to double any of their hands after splitting.
- Split aces get 1 card each: It's common when splitting aces to only be allowed one card on each Ace. You have no other options after that.
Late surrender: Late surrender is an uncommon option that allows you to forfeit your hand and lose half of your bet. This is only available before you make any other actions.
- Offer insurance: Insurance is a secondary bet offered when the dealer has an Ace showing. You bet half of your current bet. This secondary bet is that the dealer has a blackjack and it pays 2:1. If the dealer has a blackjack, they take your first bet, but then pay that bet back as your winnings for your insurance bet.

