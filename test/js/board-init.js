
// ---------------- //
// Board Init Empty //
// ---------------- //

module("Board Init Empty", {
	setup: function() {
		this.gospeed = new GoSpeed();
	}
});

test("Size", function() {
	equal(this.gospeed.board.size, 19, "When not specified, board size should default to 19.");
});

test("Mode", function() {
	equal(this.gospeed.mode, "play", "When not specified, game mode should default to 'play'.");
});

test("Ruleset", function() {
	equal(this.gospeed.ruleset, "Japanese", "When not specified, ruleset should default to 'Japanese'.");
});

test("Komi", function() {
	equal(this.gospeed.komi, undefined, "When not specified, komi should remain undefined.");
});

test("Grid", function() {
	equal(this.gospeed.board.grid.length, this.gospeed.board.size, "The grid's row count should be equal to it's size value.");
	var count = this.gospeed.board.size;
	for (var i = 0 ; i < count ; i++) {
		equal(this.gospeed.board.grid[i].length, this.gospeed.board.size, "The grid's column count for row[" + i + "] should be equal to board's size value.");
	}
});

test("Divs", function() {
	equal(this.gospeed.div_id_board, undefined, "No divs at all");
	equal(this.gospeed.div_id_clock_w, undefined, "No divs at all");
	equal(this.gospeed.div_id_clock_b, undefined, "No divs at all");
	equal(this.gospeed.div_id_captured_w, undefined, "No divs at all");
	equal(this.gospeed.div_id_captured_b, undefined, "No divs at all");
	equal(this.gospeed.div_id_score_w, undefined, "No divs at all");
	equal(this.gospeed.div_id_score_b, undefined, "No divs at all");
	equal(this.gospeed.div_id_result, undefined, "No divs at all");
	equal(this.gospeed.div_id_comments, undefined, "No divs at all");
	equal(this.gospeed.div_id_move_number, undefined, "No divs at all");
});

test("Shower", function() {
	equal(this.gospeed.sgf, undefined, "And so should be the 'sgf' property, wich would hold the original content of such div.");
	equal(this.gospeed.shower, undefined, "If there's no div, there should be no showing class.");
});

test("Timer", function() {
	equal(this.gospeed.timer, undefined, "No timer.");
});

test("GameTree", function() {
	equal(this.gospeed.game_tree.root.play, null, "At first, the game tree should have a root node with no play in it.");
	equal(this.gospeed.game_tree.root.prev, null, "The root node must never have a previous node.");
	equal(this.gospeed.game_tree.root.next.length, 0, "There must not be any nodes next to the root.");
	equal(this.gospeed.game_tree.root.last_next, null, "No last_next either");
	equal(this.gospeed.game_tree.actual_move, this.gospeed.game_tree.root, "Actual move should be the root node, ie no move.");
	equal(this.gospeed.game_tree.actual_move.root, true, "Actual move should be the root node, ie no move.");
	equal(this.tree_div, undefined, "The div which holds the graphic representation of the game tree should not be defined.");
});

test("Online", function() {
	equal(this.gospeed.my_colour, undefined, "Without argument, online colour is undefined.");
	equal(this.gospeed.turn_count, 0, "No moves played, so turn_count is 0.");
});

test("Tracks", function() {
	equal(this.gospeed.tracks.length, 1, "There must be one (main) track.");
	equal(this.gospeed.actual_track, 0, "Actual track should be the main track.");
});

test("Callbacks", function() {
	deepEqual(this.gospeed.callbacks, {}, "No callbacks.");
});

test("Next move", function() {
	equal(this.gospeed.get_next_move(), "B", "The first move should belong to 'B' player.");
});

test("Ko", function() {
	equal(this.gospeed.get_ko(), undefined, "At first, Ko should be undefined.");
});

test("Paths", function() {
	equal(this.gospeed.server_path_game_move, undefined, "By default, there is no server nor move_path.");
	equal(this.gospeed.server_path_gospeed_root, undefined, "By default, there is no server nor gospeed_root.");
	equal(this.gospeed.server_path_absolute_url, undefined, "By default, there is no server nor absolute_url.");
	equal(this.gospeed.server_path_game_end, undefined, "By default, there is no server nor game_end.");
});


// --------------- //
// Board Init Full //
// --------------- //

var BOARD_SIZE = 13;
var BOARD_MODE = "play_online";
var BOARD_RULESET = "Chinese";
var BOARD_KOMI = 6.5;
var BOARD_DIV_ID = "gospeed_board";
var BOARD_DIV_ID_CLOCK_W = "clock_w";
var BOARD_DIV_ID_CLOCK_B = "clock_b";
var BOARD_DIV_ID_CAPTURED_W = "captured_w";
var BOARD_DIV_ID_CAPTURED_B = "captured_b";
var BOARD_DIV_ID_SCORE_W = "score_w";
var BOARD_DIV_ID_SCORE_B = "score_b";
var BOARD_DIV_ID_COMMENTS = "comments";
var BOARD_DIV_ID_MOVE_NUMBER = "move_number";
var BOARD_SHOWER = "graphic";
var BOARD_TIMER_SETTINGS = {
	name: "Fischer",
	main_time: 300,
	bonus: 5,
};
var BOARD_DIV_ID_TREE = "gametree_div";
var BOARD_MY_COLOUR = "B";
var BOARD_MY_NICK = "Pato";
var BOARD_CALLBACKS = {};
var BOARD_SERVER_PATH_GOSPEED_ROOT = "..";
var BOARD_SERVER_PATH_ABSOLUTE_URL = "..";
var BOARD_SERVER_PATH_GAME_MOVE = "21/play";
var BOARD_SERVER_PATH_GAME_END = "21/end";
var BOARD_DIV_ORIGINAL_CONTENT = "(;FF[4];B[bc];W[ff];B[fb];W[bf])";

module("Board Init Full", {
	setup: function() {
		var conf = {
			size: BOARD_SIZE,
			mode: BOARD_MODE,
			ruleset: BOARD_RULESET,
			komi: BOARD_KOMI,
			div_id_board: BOARD_DIV_ID,
			div_id_tree: BOARD_DIV_ID_TREE,
			div_id_captured_w: BOARD_DIV_ID_CAPTURED_W,
			div_id_captured_b: BOARD_DIV_ID_CAPTURED_B,
			div_id_score_w: BOARD_DIV_ID_SCORE_W,
			div_id_score_b: BOARD_DIV_ID_SCORE_B,
			div_id_comments: BOARD_DIV_ID_COMMENTS,
			div_id_move_number: BOARD_DIV_ID_MOVE_NUMBER,
			shower: BOARD_SHOWER,
			my_colour: BOARD_MY_COLOUR,
			my_nick: BOARD_MY_NICK,
			callbacks: BOARD_CALLBACKS,
			server_path_gospeed_root: BOARD_SERVER_PATH_GOSPEED_ROOT,
			server_path_absolute_url: BOARD_SERVER_PATH_ABSOLUTE_URL,
			server_path_game_move: BOARD_SERVER_PATH_GAME_MOVE,
			server_path_game_end: BOARD_SERVER_PATH_GAME_END,
			time_settings: {
				div_id_clock_w: BOARD_DIV_ID_CLOCK_W,
				div_id_clock_b: BOARD_DIV_ID_CLOCK_B,
				settings: BOARD_TIMER_SETTINGS,
			},
		};
		document.getElementById(BOARD_DIV_ID).innerHTML = BOARD_DIV_ORIGINAL_CONTENT;
		this.gospeed = new GoSpeed(conf);
	},
	teardown: function() {
		delete this.gospeed;
	}
});

test("Size", function() {
	equal(this.gospeed.board.size, BOARD_SIZE, "As configured, board size should be " + BOARD_SIZE + ".");
});

test("Mode", function() {
	equal(this.gospeed.mode, BOARD_MODE, "As configured, board mode should be " + BOARD_MODE + ".");
});

test("Ruleset", function() {
	equal(this.gospeed.ruleset, BOARD_RULESET, "As configured, ruleset should be " + BOARD_RULESET + ".");
});

test("Komi", function() {
	equal(this.gospeed.komi, BOARD_KOMI, "As configured, komi should be " + BOARD_KOMI + ".");
});

test("Grid", function() {
	equal(this.gospeed.board.grid.length, this.gospeed.board.size, "The grid's row count should be equal to it's size value.");
	var count = this.gospeed.board.size;
	for (var i = 0 ; i < count ; i++) {
		equal(this.gospeed.board.grid[i].length, this.gospeed.board.size, "The grid's column count for row[" + i + "] should be equal to board's size value.");
	}
});

test("Divs", function() {
	equal(this.gospeed.div_id_board, undefined, "No divs at all");
	equal(this.gospeed.div_id_clock_w, undefined, "No divs at all");
	equal(this.gospeed.div_id_clock_b, undefined, "No divs at all");
	equal(this.gospeed.div_id_captured_w, undefined, "No divs at all");
	equal(this.gospeed.div_id_captured_b, undefined, "No divs at all");
	equal(this.gospeed.div_id_score_w, undefined, "No divs at all");
	equal(this.gospeed.div_id_score_b, undefined, "No divs at all");
	equal(this.gospeed.div_id_result, undefined, "No divs at all");
	equal(this.gospeed.div_id_comments, undefined, "No divs at all");
	equal(this.gospeed.div_id_move_number, undefined, "No divs at all");
});

test("Next move", function() {
	equal(this.gospeed.get_next_move(), "B", "The first move should belong to 'B' player.");
});

test("Ko", function() {
	equal(this.gospeed.get_ko(), undefined, "At first, Ko should be undefined.");
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
	equal(this.gospeed.game_tree.graphic.div_tree, document.getElementById(BOARD_DIV_ID_TREE), "The div which holds the graphic representation of the game tree should be the result of document.getElementById() with the tree_div_id argument.");
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

