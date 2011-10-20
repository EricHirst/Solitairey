YUI.add("labellelucie", function (Y) {

var Solitaire = Y.Solitaire,
    LaBelleLucie = Y.Solitaire.LaBelleLucie = instance(Solitaire, {
	redeals: 2,
	fields: ["Foundation", "Tableau", "Deck"],

	createEvents: function () {
		Solitaire.createEvents.call(this);
		Y.delegate("click", Solitaire.Events.clickEmptyDeck, Solitaire.selector, ".stack");

		Y.on("solitaire|newGame", function () {
			Game.redeals = 2;
			Game.redealSeed = Math.random() * 0x7FFFFFFF >>> 0;
		});
	},

	serialize: function () {
		var seed = this.redealSeed,
		    seedString = String.fromCharCode(seed >> 24) +
				String.fromCharCode((seed >> 16) & 0xFF) +
				String.fromCharCode((seed >> 8) & 0xFF) +
				String.fromCharCode(seed & 0xFF);
		return String.fromCharCode(this.redeals) + seedString + Solitaire.serialize.call(this);
	},

	unserialize: function (serialized) {
		var seedString = serialized.substr(1, 4);

		this.redeals = serialized.charCodeAt(0);
		this.redealSeed = seedString.charCodeAt(0) << 24 +
				seedString.charCodeAt(1) << 16 +
				seedString.charCodeAt(2) << 8 +
				seedString.charCodeAt(3);
		
		return Solitaire.unserialize.call(this, serialized.substr(5));
	},

	redeal: function () {
		if (!this.redeals) { return; }

		var deck = this.deck;
		deck.cards = [];

		Game.eachStack(function (stack) {
			stack.eachCard(function (card) {
				card.pushPosition();
			});

			var cards = stack.cards;

			stack.cards = [];
			deck.cards = deck.cards.concat(cards);
		}, "tableau");

		Game.pushMove(function () {
			Game.redeals++;
		});

		deck.msSeededShuffle(this.redealSeed);

		this.deal(true);
		this.redeals--;
	},

	deal: function (redeal) {
		var card,
		    deck = this.deck,
		    stack,
		    stacks = Game.tableau.stacks,
		    i;

		for (stack = 0; stack < 18; stack++) {
			for (i = 0; i < 3; i++) {
				card = deck.pop();

				if (!card) { break; }

				if (!redeal) { card.faceUp(); }

				stacks[stack].push(card);
			}
		}

		if (!redeal) {
			deck.createStack();
		}
	},

	width: function () { return this.Card.base.width * 12.5; },
	height: function () { return this.Card.base.height * 7; },
	maxStackHeight: function () { return Solitaire.Card.height * 2.5; },

	Stack: instance(Solitaire.Stack),

	Foundation: {
		stackConfig: {
			total: 4,
			layout: {
				hspacing: 1.5,
				top: 0,
				left: function () { return Solitaire.Card.width * 3.5; }
			}
		},
		field: "foundation",
	},

	Tableau: {
		stackConfig: {
			total: 18,
			layout: {
				hspacing: 2.5,
				top: function () { return Solitaire.Card.width * 2; },
				left: 0
			}
		},
		field: "tableau",
	},

	Deck: instance(Solitaire.Deck, {
		stackConfig: {
			total: 1,
			layout: {
				top: 0,
				left: 0
			}
		},
		field: "deck",
	}),

	Card: instance(Solitaire.Card, {
		playable: function () {
			return this.stack.field === "tableau" && this === this.stack.last();
		},

		validTarget: function (stack) {
			var target = stack.last();

			switch (stack.field) {
			case "tableau":
				if (!target) {
					return false
				} else {
					return target.suit === this.suit && target.rank === this.rank + 1;
				}
				break;
			case "foundation":
				if (!target) {
					return this.rank === 1;
				} else {
					return target.suit === this.suit && target.rank === this.rank - 1;
				}
				break;
			default:
				return false;
			}
		}
	})
});

Y.Array.each(LaBelleLucie.fields, function (field) {
	LaBelleLucie[field].Stack = instance(LaBelleLucie.Stack);
});


Y.mix(LaBelleLucie.Stack, {
	validTarget: function (stack) {
		return stack.field === "tableau" &&
		    this.first().validTarget(stack);
	},

	validCard: function () { return false; }
}, true);

LaBelleLucie.Deck.Stack.images = {deck: "freeslot.png"};

Y.mix(LaBelleLucie.Tableau.Stack, {
	images: {},

	setCardPosition: function (card) {
		var rankWidth = card.width / 4,
		    last = this.cards.last(),
		    top = this.top,
		    left = last ? last.left + rankWidth : this.left;

		card.left = left;
		card.top = top;
	},

	layout: function (layout, i) {
		var row = Math.floor(i / 5);

		Solitaire.Stack.layout.call(this, layout, i);

		this.top += Solitaire.Card.height * 1.5 * row;
		this.left -= Solitaire.Card.width * 12.5 * row;
	}
}, true);

}, "0.0.1", {requires: ["solitaire"]});
