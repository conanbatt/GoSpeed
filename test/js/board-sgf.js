// -------------- //
// Board with SGF //
// -------------- //

var BOARD_SIZE = 13;
var BOARD_RULESET = "Japanese";
var BOARD_MODE = "play";
var BOARD_DIV_ID = "gospeed_board";
var BOARD_TREE_DIV_ID = "gametree_div";
var BOARD_SHOWER = "graphic";
var BOARD_MY_COLOUR = "B";
var BOARD_SERVER_PATH_GAME_MOVE = "21/play";
var BOARD_SERVER_PATH_GOSPEED_ROOT = "/resources/gospeed";
var BOARD_DIV_ORIGINAL_CONTENT = "(;FF[4]SZ[9]HA[2]AB[cg][gc];W[bc];B[ff];W[fb];B[bf])";

module("Board Init Full", {
	setup: function() {
		var conf = {
			//size: BOARD_SIZE,
			ruleset: BOARD_RULESET,
			mode: BOARD_MODE,
			div_id_board: BOARD_DIV_ID,
			div_id_tree: BOARD_TREE_DIV_ID,
			shower: BOARD_SHOWER,
			//my_colour: BOARD_MY_COLOUR,
			//server_path_game_move: BOARD_SERVER_PATH_GAME_MOVE,
			//server_path_gospeed_root: BOARD_SERVER_PATH_GOSPEED_ROOT
		};
		document.getElementById(BOARD_DIV_ID).innerHTML = BOARD_DIV_ORIGINAL_CONTENT;
		this.gospeed = new GoSpeed(conf);
		this.gospeed.sgf.load(this.gospeed);
	},
	teardown: function() {
		//delete this.gospeed;
	}
});

test("Size", function() {
	equal(this.gospeed.size, 9, "Board size is 9: root node property SZ[9].");
});

test("Mode", function() {
	equal(this.gospeed.mode, BOARD_MODE, "As configured, board mode should be " + BOARD_MODE + ".");
});

test("Ruleset", function() {
	equal(this.gospeed.ruleset, BOARD_RULESET, "As configured, ruleset should be " + BOARD_RULESET + ".");
});

test("Next move", function() {
	equal(this.gospeed.get_next_move(), "W", "There is handicap, the first move belongs to 'W' player.");
});

test("Ko", function() {
	equal(this.gospeed.get_ko(), undefined, "At this point, Ko is be undefined.");
});

test("DivContent", function() {
	ok(this.gospeed.sgf == undefined || this.gospeed.sgf instanceof SGFParser, "OK, we have a div. If the div was not empty at startup, the board should have parsed it's content into de sgf property.");
	if (this.gospeed.sgf != undefined) {
		equal(this.gospeed.sgf.sgf, BOARD_DIV_ORIGINAL_CONTENT, "SGF text was saved into sgf parser sgf property.");
	}
});

test("Handicap", function() {
	equal(this.gospeed.get_pos(2, 6), "B", "First handicap stone at (2, 6).")
	equal(this.gospeed.get_pos(6, 2), "B", "Second handicap stone at (6, 2).")
});

test("Game and Seek", function() {
	equal(this.gospeed.get_next_move(), "W", "Handicap: first move belongs to 'W'.");
	this.gospeed.prev();
	equal(this.gospeed.get_next_move(), "W", "No previous move, next move still belongs to 'W'.");
	this.gospeed.next();
	equal(this.gospeed.get_next_move(), "B", "Next move belongs to 'B'.");
	this.gospeed.next();
	equal(this.gospeed.get_next_move(), "W", "Next move belongs to 'W'.");
	this.gospeed.next();
	equal(this.gospeed.get_next_move(), "B", "Next move belongs to 'B'.");
	this.gospeed.next();
	equal(this.gospeed.get_next_move(), "W", "Next move belongs to 'W'.");
	this.gospeed.next();
	equal(this.gospeed.get_next_move(), "W", "No more moves, next move still belongs to 'W'.");
});

