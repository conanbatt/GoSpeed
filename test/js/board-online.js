QUnit.config.reorder = false;

var BOARD_SIZE = 13;
var BOARD_RULESET = "Chinese";
var BOARD_MODE = "play_online";
var BOARD_DIV_ID = "gospeed_board";
var BOARD_DIV_ID_2 = "gospeed_board_2";
var BOARD_DIV_ID_3 = "gospeed_board_3";
var BOARD_TREE_DIV_ID = "gametree_div";
var BOARD_SHOWER = "graphic";
var BOARD_MY_COLOUR = "B";
var BOARD_SERVER_PATH_GAME_MOVE = "21/play";
var BOARD_SERVER_PATH_GOSPEED_ROOT = "/resources/gospeed";
var BOARD_DIV_ORIGINAL_CONTENT = "(;FF[4];B[bc];W[ff];B[fb];W[bf])";

var KAYAGLOBAL = KAYAGLOBAL || undefined;

module("OnlineSuite", {
	setup: function() {
		// Server
		this.server = new Game();

		// Board 1
		var conf = {
			size: BOARD_SIZE,
			ruleset: BOARD_RULESET,
			mode: "play_online",
			div_id_board: BOARD_DIV_ID,
			shower: BOARD_SHOWER,
			my_nick: "pocho",
			callbacks: {
				send_play: binder(function(move) {
					this.play({move: move});
				}, this.server),
			},
		};
		document.getElementById(BOARD_DIV_ID).innerHTML = "";
		this.gospeed = new GoSpeed(conf);
		this.gospeed.my_colour = this.server.connect(this.gospeed.my_nick, binder(function() {
			this.diff_update_game(arguments[0]);
		}, this.gospeed));
		this.gospeed.connected = (this.gospeed.my_colour != undefined);

		// Board 2
		var conf2 = {
			size: BOARD_SIZE,
			ruleset: BOARD_RULESET,
			mode: "play_online",
			div_id_board: BOARD_DIV_ID_2,
			shower: BOARD_SHOWER,
			my_nick: "cacho",
			callbacks: {
				send_play: binder(function(move) {
					this.play({move: move});
				}, this.server),
			},
		};
		document.getElementById(BOARD_DIV_ID_2).innerHTML = "";
		this.gospeed2 = new GoSpeed(conf2);
		this.gospeed2.my_colour = this.server.connect(this.gospeed2.my_nick, binder(function() {
			this.diff_update_game(arguments[0]);
		}, this.gospeed2));
		this.gospeed2.connected = (this.gospeed2.my_colour != undefined);

		// Board 3
		var conf3 = {
			size: BOARD_SIZE,
			ruleset: BOARD_RULESET,
			mode: "play_online",
			div_id_board: BOARD_DIV_ID_3,
			shower: BOARD_SHOWER,
			my_nick: "juancho",
			callbacks: {
				send_play: binder(function(move) {
					this.play({move: move});
				}, this.server),
			},
		};
		document.getElementById(BOARD_DIV_ID_3).innerHTML = "";
		this.gospeed3 = new GoSpeed(conf3);
		this.gospeed3.my_colour = this.server.connect(this.gospeed3.my_nick, binder(function() {
			this.diff_update_game(arguments[0]);
		}, this.gospeed3));
		this.gospeed3.connected = (this.gospeed3.my_colour != undefined);

	},
	teardown: function() {
		/*
		delete this.gospeed;
		delete this.gospeed2;
		delete this.server;
		*/
	}
});

test("Initialization", function() {
	equal(this.gospeed.get_next_move(), "B", "Board 1: first move is 'B'.");
	equal(this.gospeed2.get_next_move(), "B", "Board 2: first move is 'B'.");

	equal(this.gospeed.my_colour, "W", "Board 1: first to connect has colour 'W'.");
	equal(this.gospeed2.my_colour, "B", "Board 2: second to connect has colour 'B'.");

	ok(!this.gospeed.is_my_turn(), "Board 1: as my_colour is 'W', it is not my turn to play.");
	ok(this.gospeed2.is_my_turn(), "Board 2: as my_colour is 'B', it is my turn to play.");

	equal(this.gospeed.turn_count, 0, "Board 1: at the beginning turn_count is 0.");
	equal(this.gospeed2.turn_count, 0, "Board 2: at the beginning turn_count is 0.");
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

test("Next move", function() {
	equal(this.gospeed.get_next_move(), "B", "The first move should belong to 'B' player.");
});

test("Ko", function() {
	equal(this.gospeed.get_ko(), undefined, "At first, Ko should be undefined.");
});

test("Grid", function() {
	equal(this.gospeed.board.grid.length, this.gospeed.board.size, "The grid's row count should be equal to it's size value.");
	var count = this.gospeed.board.size;
	for (var i = 0 ; i < count ; i++) {
		equal(this.gospeed.board.grid[i].length, this.gospeed.board.size, "The grid's column count for row[" + i + "] should be equal to board's size value.");
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

test("Game", function() {
	equal(this.gospeed.turn_count, 0, "No moves played, so turn_count is 0.");
	deepEqual(this.gospeed.get_captured_count(), {"B": 0, "W": 0}, "At startup, no captures at all.");
});

test("Paths", function() {
	//var re_path = /^\/?([^\/]+\/)+$/;
	var re_path = /.*\/$/; // Ends with slash char '/'
	ok(this.gospeed.server_path_game_move == undefined || this.gospeed.server_path_game_move != "", "Whether the server_path_game_move is undefined or it is a not empty string.");
	ok(this.gospeed.server_path_gospeed_root == undefined || re_path.test(this.gospeed.server_path_gospeed_root), "Whether the server_path_gospeed_root is undefined or it is a string which ends in slash ('/').");
});

test("GamePlay", function() {
	// Play setup
	var my_colour = this.gospeed.my_colour;
	var my_colour2 = this.gospeed2.my_colour;
	// Play
	this.gospeed2.play(1, 1);
		// Board 1
			// Things that must remain untouched
			equal(this.gospeed.board.size, BOARD_SIZE, "Board 1: size unmodified.");
			equal(this.gospeed.mode, BOARD_MODE, "Board 1: mode unmodified.");
			equal(this.gospeed.ruleset, BOARD_RULESET, "Board 1: ruleset unmodified.");
			equal(this.gospeed.my_colour, my_colour, "Board 1: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed.board.get_pos(1, 1), "B", "Board 1: get_pos(1, 1) returns 'B'.");
			equal(this.gospeed.board.grid[1][1], "B", "Board 1: grid position [1][1] has 'B'.");
			equal(this.gospeed.get_ko(), undefined, "Board 1: ko is undefined.");
			equal(this.gospeed.get_next_move(), "W", "Board 1: next_move is now 'W'.");
			ok(this.gospeed.is_my_turn(), "Board 1: it's my turn.");
			deepEqual(this.gospeed.game_tree.actual_move.play.put, new Stone("B", 1, 1), "Board 1: actual move is a 'B' stone on (1, 1).");
			equal(this.gospeed.turn_count, 1, "Board 1: we have had only one turn.");
		// Board 2
			// Things that must remain untouched
			equal(this.gospeed2.board.size, BOARD_SIZE, "Board 2: size unmodified.");
			equal(this.gospeed2.mode, BOARD_MODE, "Board 2: mode unmodified.");
			equal(this.gospeed2.ruleset, BOARD_RULESET, "Board 2: ruleset unmodified.");
			equal(this.gospeed2.my_colour, my_colour2, "Board 2: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed2.board.get_pos(1, 1), "B", "Board 2: get_pos(1, 1) returns 'B'.");
			equal(this.gospeed2.board.grid[1][1], "B", "Board 2: grid position [1][1] has 'B'.");
			equal(this.gospeed2.get_ko(), undefined, "Board 2: ko is undefined.");
			equal(this.gospeed2.get_next_move(), "W", "Board 2: next_move is now 'W'.");
			ok(!this.gospeed2.is_my_turn(), "Board 2: it's no longer my turn.");
			deepEqual(this.gospeed2.game_tree.actual_move.play.put, new Stone("B", 1, 1), "Board 2: actual move is a 'B' stone on (1, 1).");
			equal(this.gospeed2.turn_count, 1, "Board 2: we have had only one turn.");

	// Play
	this.gospeed.play(1, 0);
		// Board 1
			// Things that must remain untouched
			equal(this.gospeed.board.size, BOARD_SIZE, "Board 1: size unmodified.");
			equal(this.gospeed.mode, BOARD_MODE, "Board 1: mode unmodified.");
			equal(this.gospeed.ruleset, BOARD_RULESET, "Board 1: ruleset unmodified.");
			equal(this.gospeed.my_colour, my_colour, "Board 1: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed.board.get_pos(1, 0), "W", "Board 1: get_pos(1, 0) returns 'B'.");
			equal(this.gospeed.board.grid[1][0], "W", "Board 1: grid position [1][0] has 'B'.");
			equal(this.gospeed.get_ko(), undefined, "Board 1: ko is undefined.");
			equal(this.gospeed.get_next_move(), "B", "Board 1: next_move is now 'W'.");
			ok(!this.gospeed.is_my_turn(), "Board 1: it's not my turn.");
			deepEqual(this.gospeed.game_tree.actual_move.play.put, new Stone("W", 1, 0), "Board 1: actual move is a 'W' stone on (1, 0).");
			equal(this.gospeed.turn_count, 2, "Board 1: we have had 2 turns.");
		// Board 2
			// Things that must remain untouched
			equal(this.gospeed2.board.size, BOARD_SIZE, "Board 2: size unmodified.");
			equal(this.gospeed2.mode, BOARD_MODE, "Board 2: mode unmodified.");
			equal(this.gospeed2.ruleset, BOARD_RULESET, "Board 2: ruleset unmodified.");
			equal(this.gospeed2.my_colour, my_colour2, "Board 2: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed2.board.get_pos(1, 0), "W", "Board 2: get_pos(1, 0) returns 'B'.");
			equal(this.gospeed2.board.grid[1][0], "W", "Board 2: grid position [1][0] has 'B'.");
			equal(this.gospeed2.get_ko(), undefined, "Board 2: ko is undefined.");
			equal(this.gospeed2.get_next_move(), "B", "Board 2: next_move is now 'W'.");
			ok(this.gospeed2.is_my_turn(), "Board 2: it's my turn.");
			deepEqual(this.gospeed2.game_tree.actual_move.play.put, new Stone("W", 1, 0), "Board 2: actual move is a 'W' stone on (1, 0).");
			equal(this.gospeed2.turn_count, 2, "Board 2: we have had 2 turns.");

	// Play
	this.gospeed2.play(0, 2);
		// Board 1
			// Things that must remain untouched
			equal(this.gospeed.board.size, BOARD_SIZE, "Board 1: size unmodified.");
			equal(this.gospeed.mode, BOARD_MODE, "Board 1: mode unmodified.");
			equal(this.gospeed.ruleset, BOARD_RULESET, "Board 1: ruleset unmodified.");
			equal(this.gospeed.my_colour, my_colour, "Board 1: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed.board.get_pos(0, 2), "B", "Board 1: get_pos(0, 2) returns 'B'.");
			equal(this.gospeed.board.grid[0][2], "B", "Board 1: grid position [0][2] has 'B'.");
			equal(this.gospeed.get_ko(), undefined, "Board 1: ko is undefined.");
			equal(this.gospeed.get_next_move(), "W", "Board 1: next_move is now 'W'.");
			ok(this.gospeed.is_my_turn(), "Board 1: it's my turn.");
			deepEqual(this.gospeed.game_tree.actual_move.play.put, new Stone("B", 0, 2), "Board 1: actual move is a 'B' stone on (0, 2).");
			equal(this.gospeed.turn_count, 3, "Board 1: we have had 3 turns.");
		// Board 2
			// Things that must remain untouched
			equal(this.gospeed2.board.size, BOARD_SIZE, "Board 2: size unmodified.");
			equal(this.gospeed2.mode, BOARD_MODE, "Board 2: mode unmodified.");
			equal(this.gospeed2.ruleset, BOARD_RULESET, "Board 2: ruleset unmodified.");
			equal(this.gospeed2.my_colour, my_colour2, "Board 2: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed2.board.get_pos(0, 2), "B", "Board 2: get_pos(0, 2) returns 'B'.");
			equal(this.gospeed2.board.grid[0][2], "B", "Board 2: grid position [0][2] has 'B'.");
			equal(this.gospeed2.get_ko(), undefined, "Board 2: ko is undefined.");
			equal(this.gospeed2.get_next_move(), "W", "Board 2: next_move is now 'W'.");
			ok(!this.gospeed2.is_my_turn(), "Board 2: it's no longer my turn.");
			deepEqual(this.gospeed2.game_tree.actual_move.play.put, new Stone("B", 0, 2), "Board 2: actual move is a 'B' stone on (0, 2).");
			equal(this.gospeed2.turn_count, 3, "Board 2: we have had 3 turns.");

	// Play
	this.gospeed.play(0, 1);
		// Board 1
			// Things that must remain untouched
			equal(this.gospeed.board.size, BOARD_SIZE, "Board 1: size unmodified.");
			equal(this.gospeed.mode, BOARD_MODE, "Board 1: mode unmodified.");
			equal(this.gospeed.ruleset, BOARD_RULESET, "Board 1: ruleset unmodified.");
			equal(this.gospeed.my_colour, my_colour, "Board 1: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed.board.get_pos(0, 1), "W", "Board 1: get_pos(0, 1) returns 'B'.");
			equal(this.gospeed.board.grid[0][1], "W", "Board 1: grid position [0][1] has 'B'.");
			equal(this.gospeed.get_ko(), undefined, "Board 1: ko is undefined.");
			equal(this.gospeed.get_next_move(), "B", "Board 1: next_move is now 'W'.");
			ok(!this.gospeed.is_my_turn(), "Board 1: it's not my turn.");
			deepEqual(this.gospeed.game_tree.actual_move.play.put, new Stone("W", 0, 1), "Board 1: actual move is a 'W' stone on (0, 1).");
			equal(this.gospeed.turn_count, 4, "Board 1: we have had 4 turns.");
		// Board 2
			// Things that must remain untouched
			equal(this.gospeed2.board.size, BOARD_SIZE, "Board 2: size unmodified.");
			equal(this.gospeed2.mode, BOARD_MODE, "Board 2: mode unmodified.");
			equal(this.gospeed2.ruleset, BOARD_RULESET, "Board 2: ruleset unmodified.");
			equal(this.gospeed2.my_colour, my_colour2, "Board 2: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed2.board.get_pos(1, 0), "W", "Board 2: get_pos(0, 1) returns 'B'.");
			equal(this.gospeed2.board.grid[0][1], "W", "Board 2: grid position [0][1] has 'B'.");
			equal(this.gospeed2.get_ko(), undefined, "Board 2: ko is undefined.");
			equal(this.gospeed2.get_next_move(), "B", "Board 2: next_move is now 'W'.");
			ok(this.gospeed2.is_my_turn(), "Board 2: it's my turn.");
			deepEqual(this.gospeed2.game_tree.actual_move.play.put, new Stone("W", 0, 1), "Board 2: actual move is a 'W' stone on (0, 1).");
			equal(this.gospeed2.turn_count, 4, "Board 2: we have had 4 turns.");

	// Play
	this.gospeed2.play(0, 0);
		// Board 1
			// Things that must remain untouched
			equal(this.gospeed.board.size, BOARD_SIZE, "Board 1: size unmodified.");
			equal(this.gospeed.mode, BOARD_MODE, "Board 1: mode unmodified.");
			equal(this.gospeed.ruleset, BOARD_RULESET, "Board 1: ruleset unmodified.");
			equal(this.gospeed.my_colour, my_colour, "Board 1: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed.board.get_pos(0, 0), "B", "Board 1: get_pos(0, 0) returns 'B'.");
			equal(this.gospeed.board.grid[0][0], "B", "Board 1: grid position [0][0] has 'B'.");
			equal(this.gospeed.board.get_pos(0, 1), undefined, "Board 1: get_pos(0, 1) returns undefined.");
			equal(this.gospeed.board.grid[0][1], undefined, "Board 1: grid position [0][1] has undefined.");
			deepEqual(this.gospeed.get_ko(), {row: 0, col: 1}, "Board 1: position (0, 1) is ko.");
			equal(this.gospeed.get_next_move(), "W", "Board 1: next_move is now 'W'.");
			ok(this.gospeed.is_my_turn(), "Board 1: it's my turn.");
			deepEqual(this.gospeed.game_tree.actual_move.play.put, new Stone("B", 0, 0), "Board 1: actual move is a 'B' stone on (0, 0).");
			equal(this.gospeed.turn_count, 5, "Board 1: we have had 5 turns.");
		// Board 2
			// Things that must remain untouched
			equal(this.gospeed2.board.size, BOARD_SIZE, "Board 2: size unmodified.");
			equal(this.gospeed2.mode, BOARD_MODE, "Board 2: mode unmodified.");
			equal(this.gospeed2.ruleset, BOARD_RULESET, "Board 2: ruleset unmodified.");
			equal(this.gospeed2.my_colour, my_colour2, "Board 2: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed2.board.get_pos(0, 0), "B", "Board 2: get_pos(0, 0) returns 'B'.");
			equal(this.gospeed2.board.grid[0][0], "B", "Board 2: grid position [0][0] has 'B'.");
			equal(this.gospeed2.board.get_pos(0, 1), undefined, "Board 2: get_pos(0, 1) returns undefined.");
			equal(this.gospeed2.board.grid[0][1], undefined, "Board 2: grid position [0][1] has undefined.");
			deepEqual(this.gospeed2.get_ko(), {row: 0, col: 1}, "Board 2: position (0, 1) is ko.");
			equal(this.gospeed2.get_next_move(), "W", "Board 2: next_move is now 'W'.");
			ok(!this.gospeed2.is_my_turn(), "Board 2: it's no longer my turn.");
			deepEqual(this.gospeed2.game_tree.actual_move.play.put, new Stone("B", 0, 0), "Board 2: actual move is a 'B' stone on (0, 0).");
			equal(this.gospeed2.turn_count, 5, "Board 2: we have had 5 turns.");


	deepEqual(this.gospeed.get_captured_count(), {"B": 0, "W": 1}, "Only one white stone captured.");
	this.gospeed.play(6, 6);
	this.gospeed2.play(3, 9);
	this.gospeed.play(2, 9);
	this.gospeed2.play(6, 7);
	this.gospeed.play(3, 8);
	this.gospeed2.play(5, 6);
	this.gospeed.play(4, 9);
	this.gospeed2.play(6, 5);
	this.gospeed.play(3, 10);
	deepEqual(this.gospeed.get_captured_count(), {B: 1, W: 1}, "Now we have also a black stone captured.");
	this.gospeed2.play(7, 6);
	deepEqual(this.gospeed.get_captured_count(), {B: 1, W: 2}, "And another white stone captured.");
	this.gospeed.play(0, 1);
	deepEqual(this.gospeed.get_captured_count(), {B: 2, W: 2}, "And the last black stone captured, ending in ko.");

		// Board 1
			// Things that must remain untouched
			equal(this.gospeed.board.size, BOARD_SIZE, "Board 1: size unmodified.");
			equal(this.gospeed.mode, BOARD_MODE, "Board 1: mode unmodified.");
			equal(this.gospeed.ruleset, BOARD_RULESET, "Board 1: ruleset unmodified.");
			equal(this.gospeed.my_colour, my_colour, "Board 1: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed.board.get_pos(0, 0), undefined, "Board 1: get_pos(0, 0) returns undefined.");
			equal(this.gospeed.board.grid[0][0], undefined, "Board 1: grid position [0][0] has undefined.");
			deepEqual(this.gospeed.get_ko(), {row: 0, col: 0}, "Board 1: position (0, 0) is ko.");
			equal(this.gospeed.get_next_move(), "B", "Board 1: next_move is now 'B'.");
			ok(!this.gospeed.is_my_turn(), "Board 1: it's not my turn.");
			deepEqual(this.gospeed.game_tree.actual_move.play.put, new Stone("W", 0, 1), "Board 1: actual move is a 'W' stone on (0, 1).");
			equal(this.gospeed.turn_count, 16, "Board 1: we have had 16 turns.");
		// Board 2
			// Things that must remain untouched
			equal(this.gospeed2.board.size, BOARD_SIZE, "Board 2: size unmodified.");
			equal(this.gospeed2.mode, BOARD_MODE, "Board 2: mode unmodified.");
			equal(this.gospeed2.ruleset, BOARD_RULESET, "Board 2: ruleset unmodified.");
			equal(this.gospeed2.my_colour, my_colour2, "Board 2: my_colour remained untouched.");
			// Test new game state after play
			equal(this.gospeed2.board.get_pos(0, 0), undefined, "Board 2: get_pos(0, 0) returns undefined.");
			equal(this.gospeed2.board.grid[0][0], undefined, "Board 2: grid position [0][0] has undefined.");
			deepEqual(this.gospeed2.get_ko(), {row: 0, col: 0}, "Board 2: position (0, 0) is ko.");
			equal(this.gospeed2.get_next_move(), "B", "Board 2: next_move is now 'B'.");
			ok(this.gospeed2.is_my_turn(), "Board 2: it's my turn.");
			deepEqual(this.gospeed2.game_tree.actual_move.play.put, new Stone("W", 0, 1), "Board 2: actual move is a 'W' stone on (0, 1).");
			equal(this.gospeed2.turn_count, 16, "Board 2: we have had 16 turns.");
});

