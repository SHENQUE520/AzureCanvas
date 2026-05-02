//#region src/config/cardConfig.js
/**
* 标准扑克牌配置（52张 + 2鬼牌）
* 花色：♠ ♥ ♣ ♦
* 点数：A,2,3,4,5,6,7,8,9,10,J,Q,K
*/
var POKER_CARDS = [
	{
		suit: "♠",
		rank: "A",
		text: "♠ A",
		letter: "A",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "2",
		text: "♠ 2",
		letter: "2",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "3",
		text: "♠ 3",
		letter: "3",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "4",
		text: "♠ 4",
		letter: "4",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "5",
		text: "♠ 5",
		letter: "5",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "6",
		text: "♠ 6",
		letter: "6",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "7",
		text: "♠ 7",
		letter: "7",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "8",
		text: "♠ 8",
		letter: "8",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "9",
		text: "♠ 9",
		letter: "9",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "10",
		text: "♠ 10",
		letter: "10",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "J",
		text: "♠ J",
		letter: "J",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "Q",
		text: "♠ Q",
		letter: "Q",
		color: "#000000"
	},
	{
		suit: "♠",
		rank: "K",
		text: "♠ K",
		letter: "K",
		color: "#000000"
	},
	{
		suit: "♥",
		rank: "A",
		text: "♥ A",
		letter: "A",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "2",
		text: "♥ 2",
		letter: "2",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "3",
		text: "♥ 3",
		letter: "3",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "4",
		text: "♥ 4",
		letter: "4",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "5",
		text: "♥ 5",
		letter: "5",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "6",
		text: "♥ 6",
		letter: "6",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "7",
		text: "♥ 7",
		letter: "7",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "8",
		text: "♥ 8",
		letter: "8",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "9",
		text: "♥ 9",
		letter: "9",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "10",
		text: "♥ 10",
		letter: "10",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "J",
		text: "♥ J",
		letter: "J",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "Q",
		text: "♥ Q",
		letter: "Q",
		color: "#cc0000"
	},
	{
		suit: "♥",
		rank: "K",
		text: "♥ K",
		letter: "K",
		color: "#cc0000"
	},
	{
		suit: "♣",
		rank: "A",
		text: "♣ A",
		letter: "A",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "2",
		text: "♣ 2",
		letter: "2",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "3",
		text: "♣ 3",
		letter: "3",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "4",
		text: "♣ 4",
		letter: "4",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "5",
		text: "♣ 5",
		letter: "5",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "6",
		text: "♣ 6",
		letter: "6",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "7",
		text: "♣ 7",
		letter: "7",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "8",
		text: "♣ 8",
		letter: "8",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "9",
		text: "♣ 9",
		letter: "9",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "10",
		text: "♣ 10",
		letter: "10",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "J",
		text: "♣ J",
		letter: "J",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "Q",
		text: "♣ Q",
		letter: "Q",
		color: "#000000"
	},
	{
		suit: "♣",
		rank: "K",
		text: "♣ K",
		letter: "K",
		color: "#000000"
	},
	{
		suit: "♦",
		rank: "A",
		text: "♦ A",
		letter: "A",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "2",
		text: "♦ 2",
		letter: "2",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "3",
		text: "♦ 3",
		letter: "3",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "4",
		text: "♦ 4",
		letter: "4",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "5",
		text: "♦ 5",
		letter: "5",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "6",
		text: "♦ 6",
		letter: "6",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "7",
		text: "♦ 7",
		letter: "7",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "8",
		text: "♦ 8",
		letter: "8",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "9",
		text: "♦ 9",
		letter: "9",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "10",
		text: "♦ 10",
		letter: "10",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "J",
		text: "♦ J",
		letter: "J",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "Q",
		text: "♦ Q",
		letter: "Q",
		color: "#cc0000"
	},
	{
		suit: "♦",
		rank: "K",
		text: "♦ K",
		letter: "K",
		color: "#cc0000"
	}
];
var JOKER_CONFIG = {
	big: {
		text: "JOKER",
		displayText: "🃏 大王",
		color: "#ef4444",
		bgColor: "#2a0a0a",
		isJoker: true,
		subType: "big"
	},
	small: {
		text: "joker",
		displayText: "🃏 小王",
		color: "#f59e0b",
		bgColor: "#2a1a0a",
		isJoker: true,
		subType: "small"
	}
};
function generateFullDeck() {
	const deck = [...POKER_CARDS];
	deck.push(JOKER_CONFIG.big, JOKER_CONFIG.small);
	return deck;
}
var CARD_APPEARANCE = {
	width: 1.2,
	height: 1.68,
	depth: .05,
	cornerRadius: 8,
	stackSpacing: .02,
	font: {
		letter: "bold 48px \"Inter\", system-ui, sans-serif",
		word: "24px \"Inter\", system-ui, sans-serif",
		joker: "bold 36px \"Inter\", system-ui, sans-serif"
	},
	defaultColors: {
		english: {
			text: "#ffffff",
			bg: "#1a2a4a",
			border: "#4a7ab5"
		},
		phonetic: {
			text: "#ffffff",
			bg: "#2a1a3a",
			border: "#9b59b6"
		},
		placeholder: {
			text: "#888888",
			bg: "#1a1a1a",
			border: "#444444"
		}
	}
};
//#endregion
export { CARD_APPEARANCE, generateFullDeck };
