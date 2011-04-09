
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
	equal(this.gospeed.grid[0][0], undefined);
	this.gospeed.put_stone("W", 0, 0);
	equal(this.gospeed.grid[0][0], "W");

	equal(this.gospeed.grid[1][1], undefined);
	this.gospeed.put_stone("B", 1, 1);
	equal(this.gospeed.grid[1][1], "B");
});

test("get_pos: raw position-checking method", function() {
	equal(this.gospeed.get_pos(2, 2), undefined);
	this.gospeed.put_stone("W", 2, 2);
	equal(this.gospeed.get_pos(2, 2), "W");

	equal(this.gospeed.get_pos(3, 3), undefined);
	this.gospeed.put_stone("B", 3, 3);
	equal(this.gospeed.get_pos(3, 3), "B");
});

test("play: in-game stone-placing method", function() {
	equal(this.gospeed.next_move, "B");
	this.gospeed.play(4, 4);
	equal(this.gospeed.get_pos(4, 4), "B");
	equal(this.gospeed.next_move, "W");
});

