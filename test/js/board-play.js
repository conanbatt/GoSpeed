
var BOARD_SIZE = 19;
var BOARD_RULESET = "Japanese";
var BOARD_MODE = "play";

module("Board Play", {
	setup: function() {
		var conf = {
			size: BOARD_SIZE,
			ruleset: BOARD_RULESET,
			mode: BOARD_MODE
		};
		this.gospeed = new GoSpeed(conf);
	}
});

test("put_stone: raw stone-placing method", function() {
	equal(this.gospeed.grid[0][0], undefined, "At first, position (0, 0) of the grid should be 'undefined'.");
	this.gospeed.put_stone("W", 0, 0);
	equal(this.gospeed.grid[0][0], "W", "Once we put_stone('W', 0, 0), grid[0][0] should be 'W'.");

	equal(this.gospeed.grid[1][1], undefined, "This far, position (1, 1) of the grid should be 'undefined'.");
	this.gospeed.put_stone("B", 1, 1);
	equal(this.gospeed.grid[1][1], "B", "Once we put_stone('B', 1, 1), grid[1][1] should be 'B'.");
});

test("get_pos: raw position-checking method", function() {
	equal(this.gospeed.get_pos(2, 2), undefined, "At first, position (2, 2) of the grid should be 'undefined'.");
	this.gospeed.grid[2][2] = "W";
	equal(this.gospeed.get_pos(2, 2), "W", "Once we did grid[2][2] = 'W', get_pos(2, 2) should be 'W'.");

	equal(this.gospeed.get_pos(3, 3), undefined, "This far, position (3, 3) of the grid should be 'undefined'.");
	this.gospeed.grid[3][3] = "B";
	equal(this.gospeed.get_pos(3, 3), "B", "Once we did grid[3][3] = 'B', get_pos(3, 3) should be 'B'.");
});

test("put_stone - get_pos: combined stone-placing / position-checking method", function() {
	equal(this.gospeed.get_pos(2, 2), undefined, "At first, get_pos(2, 2) should be 'undefined'.");
	this.gospeed.put_stone("W", 2, 2);
	equal(this.gospeed.get_pos(2, 2), "W", "Once we put_stone('W', 2, 2), get_pos(2, 2) should be 'W'.");

	equal(this.gospeed.get_pos(3, 3), undefined, "This far, get_pos(3, 3) should be 'undefined'.");
	this.gospeed.put_stone("B", 3, 3);
	equal(this.gospeed.get_pos(3, 3), "B", "Once we put_stone('B', 3, 3), get_pos(3, 3) should be 'B'.");
});

test("play: in-game stone-placing method", function() {
	equal(this.gospeed.next_move, "B", "At the begining, next_move should be 'B'.");
	this.gospeed.play(4, 4);
	equal(this.gospeed.get_pos(4, 4), "B", "After we play in (4, 4) the stone in that position should be 'B'.");
	equal(this.gospeed.next_move, "W", "After the first move, next_move should be 'W'.");
});

