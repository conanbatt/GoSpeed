
// ---------------- //
// Board Init Empty //
// ---------------- //

module("Board Init Empty", {
	setup: function() {
		this.gospeed = new GoSpeed();
	}
});

test("Size", function() {
	equal(this.gospeed.size, 19, "When not specified, board size should default to 19.");
});

test("Mode", function() {
	equal(this.gospeed.mode, "play", "When not specified, game mode should default to 'play'.");
});

test("Ruleset", function() {
	equal(this.gospeed.ruleset, "Japanese", "When not specified, ruleset should default to 'Japanese'.");
});

test("Next move", function() {
	equal(this.gospeed.get_next_move(), "B", "The first move should belong to 'B' player.");
});

test("Ko", function() {
	equal(this.gospeed.ko, undefined, "At first, Ko should be undefined.");
});

test("Grid", function() {
	equal(this.gospeed.grid.length, this.gospeed.size, "The grid's row count should be equal to it's size value.");
	var count = this.gospeed.size;
	for (var i = 0 ; i < count ; i++) {
		equal(this.gospeed.grid[i].length, this.gospeed.size, "The grid's column count for row[" + i + "] should be equal to board's size value.");
	}
});

test("Shower", function() {
	equal(this.gospeed.sgf, undefined, "And so should be the 'sgf' property, wich would hold the original content of such div.");
	equal(this.gospeed.shower, undefined, "If there's no div, there should be no showing class.");
});

test("GameTree", function() {
	equal(this.gospeed.game_tree.root.play, null, "At first, the game tree should have a root node with no play in it.");
	equal(this.gospeed.game_tree.root.prev, null, "The root node must never have a previous node.");
	equal(this.gospeed.game_tree.root.next.length, 0, "There must not be any nodes next to the root.");
	equal(this.gospeed.game_tree.root.last_next, null, "No last_next either");
	equal(this.gospeed.game_tree.actual_move, this.gospeed.game_tree.root, "Actual move should be the root node, ie no move.");
	equal(this.tree_div, undefined, "The div which holds the graphic representation of the game tree should not be defined.");
});

test("Online", function() {
	equal(this.gospeed.my_colour, undefined, "Without argument, online colour is undefined.");
	equal(this.gospeed.turn_count, 0, "No moves played, so turn_count is 0.");
});

test("Paths", function() {
	equal(this.gospeed.server_path_game_move, undefined, "By default, there is no server nor move_path.");
	equal(this.gospeed.server_path_gospeed_root, undefined, "By default, there is no server nor gospeed_root.");
});


// --------------- //
// Board Init Full //
// --------------- //

var BOARD_SIZE = 13;
var BOARD_RULESET = "Chinese";
var BOARD_MODE = "play_online";
var BOARD_DIV_ID = "gospeed_board";
var BOARD_TREE_DIV_ID = "gametree_div";
var BOARD_SHOWER = "graphic";
var BOARD_MY_COLOUR = "B";
var BOARD_SERVER_PATH_GAME_MOVE = "21/play";
var BOARD_SERVER_PATH_GOSPEED_ROOT = "/resources/gospeed";
var BOARD_DIV_ORIGINAL_CONTENT = "(;FF[4];B[bc];W[ff];B[fb];W[bf])";

module("Board Init Full", {
	setup: function() {
		var conf = {
			size: BOARD_SIZE,
			ruleset: BOARD_RULESET,
			mode: BOARD_MODE,
			div_id_board: BOARD_DIV_ID,
			div_id_tree: BOARD_TREE_DIV_ID,
			shower: BOARD_SHOWER,
			my_colour: BOARD_MY_COLOUR,
			server_path_game_move: BOARD_SERVER_PATH_GAME_MOVE,
			server_path_gospeed_root: BOARD_SERVER_PATH_GOSPEED_ROOT
		};
		document.getElementById(BOARD_DIV_ID).innerHTML = BOARD_DIV_ORIGINAL_CONTENT;
		this.gospeed = new GoSpeed(conf);
	},
	teardown: function() {
		delete this.gospeed;
	}
});

test("Size", function() {
	equal(this.gospeed.size, BOARD_SIZE, "As configured, board size should be " + BOARD_SIZE + ".");
});

test("Mode", function() {
	equal(this.gospeed.mode, BOARD_MODE, "As configured, board mode should be " + BOARD_MODE + ".");
});

test("Ruleset", function() {
	equal(this.gospeed.ruleset, BOARD_RULESET, "As configured, ruleset should be " + BOARD_RULESET + ".");
});

test("Next move", function() {
	equal(this.gospeed.get_next_move(), "B", "The first move should belong to 'B' player.");
});

test("Ko", function() {
	equal(this.gospeed.ko, undefined, "At first, Ko should be undefined.");
});

test("Grid", function() {
	equal(this.gospeed.grid.length, this.gospeed.size, "The grid's row count should be equal to it's size value.");
	var count = this.gospeed.size;
	for (var i = 0 ; i < count ; i++) {
		equal(this.gospeed.grid[i].length, this.gospeed.size, "The grid's column count for row[" + i + "] should be equal to board's size value.");
	}
});

test("DivContent", function() {
	ok(this.gospeed.sgf == undefined || this.gospeed.sgf instanceof SGFParser, "OK, we have a div. If the div was not empty at startup, the board should have parsed it's content into de sgf property.");
	if (this.gospeed.sgf != undefined) {
		equal(this.gospeed.sgf.sgf, BOARD_DIV_ORIGINAL_CONTENT, "SGF text was saved into sgf parser sgf property.");
	}
});

if (BOARD_SHOWER == "graphic") {
	test("GoGraphic", function() {
		ok(this.gospeed.shower instanceof GoGraphic, "As configured, the showing engine should be GoGraphic.");
		ok(this.gospeed.shower.game === this.gospeed, "Game reference in GoGraphic is correct.");
		equal(this.gospeed.shower.div_board, document.getElementById(BOARD_DIV_ID), "The shower div_board property must hold the result of document.getElementById(BOARD_DIV_ID).");
		// TODO: complete gograhpic tests.
	});
}

test("GameTree", function() {
	equal(this.gospeed.game_tree.root.play, null, "At first, the game tree should have a root node with no play in it.");
	equal(this.gospeed.game_tree.root.prev, null, "The root node must never have a previous node.");
	equal(this.gospeed.game_tree.root.next.length, 0, "There must not be any nodes next to the root.");
	equal(this.gospeed.game_tree.root.last_next, null, "No last_next either");
	equal(this.gospeed.game_tree.actual_move, this.gospeed.game_tree.root, "Actual move should be the root node, ie no move.");
	equal(this.gospeed.tree_div, document.getElementById(BOARD_TREE_DIV_ID), "The div which holds the graphic representation of the game tree should be the result of document.getElementById() with the tree_div_id argument.");
});

test("Online", function() {
	equal(this.gospeed.my_colour, BOARD_MY_COLOUR, "As configured, my_colour is '" + BOARD_MY_COLOUR + "'.");
	equal(this.gospeed.turn_count, 0, "No moves played, so turn_count is 0.");
});

test("Paths", function() {
	//var re_path = /^\/?([^\/]+\/)+$/;
	var re_path = /.*\/$/; // Ends with slash char '/'
	ok(this.gospeed.server_path_game_move == undefined || this.gospeed.server_path_game_move != "", "Whether the server_path_game_move is undefined or it is a not empty string.");
	ok(this.gospeed.server_path_gospeed_root == undefined || re_path.test(this.gospeed.server_path_gospeed_root), "Whether the server_path_gospeed_root is undefined or it is a string which ends in slash ('/').");
});

