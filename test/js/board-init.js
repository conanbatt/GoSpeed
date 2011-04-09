
var BOARD_SIZE = 19;
var BOARD_RULESET = "Japanese";
var BOARD_MODE = "play";

module("Board Init", {
	setup: function() {
		var conf = {
			size: BOARD_SIZE,
			ruleset: BOARD_RULESET,
			mode: BOARD_MODE
		};
		this.gospeed = new GoSpeed(conf);
	}
});

test("Board Size and Grid", function() {
	equal(this.gospeed.size, BOARD_SIZE);
	equal(this.gospeed.grid.length, this.gospeed.size);
	var count = this.gospeed.size;
	for (var i = 0 ; i < count ; i++) {
		equal(this.gospeed.grid[i].length, this.gospeed.size);
	}
});

test("Ruleset", function() {
	equal(this.gospeed.ruleset, BOARD_RULESET);
});

test("Board Mode", function() {
	equal(this.gospeed.mode, BOARD_MODE);
});

test("Next move", function() {
	equal(this.gospeed.next_move, "B");
});

