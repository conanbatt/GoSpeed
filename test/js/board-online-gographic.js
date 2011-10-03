var BOARD_SIZE = 13;
var BOARD_RULESET = "Chinese";
var BOARD_MODE = "play_online";
var BOARD_DIV_ID = "gospeed_board";
var BOARD_DIV_ID_2 = "gospeed_board_2";
var BOARD_TREE_DIV_ID = "gametree_div";
var BOARD_SHOWER = "graphic";
var BOARD_MY_COLOUR = "B";
var BOARD_SERVER_PATH_GAME_MOVE = "21/play";
var BOARD_SERVER_PATH_GOSPEED_ROOT = "/resources/gospeed";
var BOARD_DIV_ORIGINAL_CONTENT = "(;FF[4];B[bc];W[ff];B[fb];W[bf])";

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
		};
		document.getElementById(BOARD_DIV_ID).innerHTML = "";
		this.gospeed = new GoSpeed(conf);
		this.gospeed.my_colour = this.server.connect(binder(function(move_list) {
			this.update_game(move_list);
		}, this.gospeed));
		this.gospeed.send_play = binder(function(play) {
			this.play({move: coord_converter(play)});
		}, this.server);

		// Board 2
		var conf2 = {
			size: BOARD_SIZE,
			ruleset: BOARD_RULESET,
			mode: "play_online",
			div_id_board: BOARD_DIV_ID_2,
			shower: BOARD_SHOWER,
		};
		document.getElementById(BOARD_DIV_ID_2).innerHTML = "";
		this.gospeed2 = new GoSpeed(conf2);
		this.gospeed2.my_colour = this.server.connect(binder(function(move_list) {
			this.update_game(move_list);
		}, this.gospeed2));
		this.gospeed2.send_play = binder(function(play) {
			this.play({move: coord_converter(play)});
		}, this.server);

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
	equal(this.gospeed.size, this.gospeed2.size, "Board sizes are equal.");
	equal(this.gospeed.shower.grid.length, this.gospeed.size, "Board 1: shower grid row count equals game size.");
	equal(this.gospeed2.shower.grid.length, this.gospeed2.size, "Board 2: shower grid row count equals game size.");
	for (var row = 0; row < this.gospeed.size; row++) {
		equal(this.gospeed.shower.grid[row].length, this.gospeed.size, "Board 1: shower grid row "+row+" col count equals game size.");
		equal(this.gospeed2.shower.grid[row].length, this.gospeed2.size, "Board 2: shower grid row "+row+" col count equals game size.");
		for (var col = 0; col < this.gospeed.size; col++) {
			equal(this.gospeed.shower.grid[row][col], undefined, "Board 1: at startup grid["+row+"]["+col+"] is undefined.");
			equal(this.gospeed.shower.grid[row][col], this.gospeed2.shower.grid[row][col], "Board 2: at startup grid["+row+"]["+col+"] is equal to Board 1.");
		}
	}

	// Mouse move Board 1
	triggerMouseMove(this.gospeed.shower.div_board, 1, 1);
	equal(this.gospeed.shower.t_black.style.display, "none", "Board 1: as it's not my turn, black transparent stone must not be displayed.");
	equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: as it's not my turn, white transparent stone must not be displayed.");

	// Mouse move Board 1
	triggerMouseMove(this.gospeed2.shower.div_board, 1, 1);
	equal(this.gospeed2.shower.t_black.style.display, "block", "Board 2: it's my turn, black transparent stone must be displayed.");
	equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: it's my turn, but my colour is black, so white transparent stone must not be displayed.");
});

test("GamePlay", function() {
	// Play
	this.gospeed2.play(1, 1);
		// Board 1
			// Things that must remain untouched
			equal(this.gospeed.shower.max_bound, this.gospeed.size * STONE_SIZE + BOARD_BOUND, "Board 1: max_bound remained untouched.");
			// These are for gographic test swite
			notEqual(this.gospeed.shower.grid[1][1], undefined, "Board 1: shower grid position [1][1] must not be undefined.");
			equal(this.gospeed.shower.grid[1][1][0].className, "StoneB", "Board 1: current stone class name must be 'StoneB'.");
			equal(this.gospeed.shower.grid[1][1][0].style.top, "35px", "Board 1: current stone must be positioned on top: 35px.");
			equal(this.gospeed.shower.grid[1][1][0].style.left, "35px", "Board 1: current stone must be positioned on left: 35px.");
			equal(this.gospeed.shower.grid[1][1][1].className, "Shadow", "Board 1: current shadow class name must be 'Shadow'.");
			equal(this.gospeed.shower.grid[1][1][1].style.top, "37px", "Board 1: current shadow must be positioned on top: 37px.");
			equal(this.gospeed.shower.grid[1][1][1].style.left, "37px", "Board 1: current shadow must be positioned on left: 37px.");
			equal(this.gospeed.shower.ko.className, "Ko", "Board 1: shower ko class name is 'Ko'.");
			equal(this.gospeed.shower.ko.style.display, "none", "Board 1: shower ko is not being displayed.");
			equal(this.gospeed.shower.t_white.className, "StoneTW", "Board 1: shower transparent white stone's class name is 'StoneTW'.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: shower transparent white strone is not being displayed.");
			equal(this.gospeed.shower.t_black.className, "StoneTB", "Board 1: shower transparent black stone's class name is 'StoneTB'.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: shower transparent white strone is not being displayed.");
			// Mouse move
			triggerMouseMove(this.gospeed.shower.div_board, 1, 1);
			equal(this.gospeed.shower.t_black.style.display, "none", "Board 1: position (1, 1) has a stone, black transparent stone must not be displayed.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: position (1, 1) has a stone, white transparent stone must not be displayed.");
			triggerMouseMove(this.gospeed.shower.div_board, 2, 0);
			equal(this.gospeed.shower.t_black.style.display, "none", "Board 1: position (2, 0) is empty, but my colour is not black. Black transparent stone must not be displayed.");
			equal(this.gospeed.shower.t_white.style.display, "block", "Board 1: position (2, 0) is empty and it's my turn. White transparent stone must be displayed.");
		// Board 2
			// Things that must remain untouched
			equal(this.gospeed2.shower.max_bound, this.gospeed2.size * STONE_SIZE + BOARD_BOUND, "Board 2: max_bound remained untouched.");
			// These are for gographic test swite
			notEqual(this.gospeed2.shower.grid[1][1], undefined, "Board 2: shower grid position [1][1] must not be undefined.");
			equal(this.gospeed2.shower.grid[1][1][0].className, "StoneB", "Board 2: current stone class name must be 'StoneB'.");
			equal(this.gospeed2.shower.grid[1][1][0].style.top, "35px", "Board 2: current stone must be positioned on top: 35px.");
			equal(this.gospeed2.shower.grid[1][1][0].style.left, "35px", "Board 2: current stone must be positioned on left: 35px.");
			equal(this.gospeed2.shower.grid[1][1][1].className, "Shadow", "Board 2: current shadow class name must be 'Shadow'.");
			equal(this.gospeed2.shower.grid[1][1][1].style.top, "37px", "Board 2: current shadow must be positioned on top: 37px.");
			equal(this.gospeed2.shower.grid[1][1][1].style.left, "37px", "Board 2: current shadow must be positioned on left: 37px.");
			equal(this.gospeed2.shower.ko.className, "Ko", "Board 2: shower ko class name is 'Ko'.");
			equal(this.gospeed2.shower.ko.style.display, "none", "Board 2: shower ko is not being displayed.");
			equal(this.gospeed2.shower.t_white.className, "StoneTW", "Board 2: shower transparent white stone's class name is 'StoneTW'.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: shower transparent white strone is not being displayed.");
			equal(this.gospeed2.shower.t_black.className, "StoneTB", "Board 2: shower transparent black stone's class name is 'StoneTB'.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: shower transparent white strone is not being displayed.");
			// Mouse move
			triggerMouseMove(this.gospeed2.shower.div_board, 1, 1);
			equal(this.gospeed2.shower.t_black.style.display, "none", "Board 2: position (1, 1) has a stone, black transparent stone must not be displayed.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: position (1, 1) has a stone, white transparent stone must not be displayed.");
			triggerMouseMove(this.gospeed2.shower.div_board, 2, 0);
			equal(this.gospeed2.shower.t_black.style.display, "none", "Board 1: position (2, 0) is empty but it's not my turn. Black transparent stone must not be displayed.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 1: position (2, 0) is empty, but my colour is not white. White transparent stone must not be displayed.");

	// Play
	this.gospeed.play(1, 0);
		// Board 1
			// Things that must remain untouched
			equal(this.gospeed.shower.max_bound, this.gospeed.size * STONE_SIZE + BOARD_BOUND, "Board 1: max_bound remained untouched.");
			// These are for gographic test swite
			notEqual(this.gospeed.shower.grid[1][0], undefined, "Board 1: shower grid position [1][0] must not be undefined.");
			equal(this.gospeed.shower.grid[1][0][0].className, "StoneW", "Board 1: current stone class name must be 'StoneW'.");
			equal(this.gospeed.shower.grid[1][0][0].style.top, "35px", "Board 1: current stone must be positioned on top: 35px.");
			equal(this.gospeed.shower.grid[1][0][0].style.left, "10px", "Board 1: current stone must be positioned on left: 10px.");
			equal(this.gospeed.shower.grid[1][0][1].className, "Shadow", "Board 1: current shadow class name must be 'Shadow'.");
			equal(this.gospeed.shower.grid[1][0][1].style.top, "37px", "Board 1: current shadow must be positioned on top: 37px.");
			equal(this.gospeed.shower.grid[1][0][1].style.left, "12px", "Board 1: current shadow must be positioned on left: 12px.");
			equal(this.gospeed.shower.ko.className, "Ko", "Board 1: shower ko class name is 'Ko'.");
			equal(this.gospeed.shower.ko.style.display, "none", "Board 1: shower ko is not being displayed.");
			equal(this.gospeed.shower.t_white.className, "StoneTW", "Board 1: shower transparent white stone's class name is 'StoneTW'.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: shower transparent white strone is not being displayed.");
			equal(this.gospeed.shower.t_black.className, "StoneTB", "Board 1: shower transparent black stone's class name is 'StoneTB'.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: shower transparent white strone is not being displayed.");
			// Mouse move
			triggerMouseMove(this.gospeed.shower.div_board, 1, 1);
			equal(this.gospeed.shower.t_black.style.display, "none", "Board 1: position (1, 1) has a stone, black transparent stone must not be displayed.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: position (1, 1) has a stone, white transparent stone must not be displayed.");
			triggerMouseMove(this.gospeed.shower.div_board, 2, 0);
			equal(this.gospeed.shower.t_black.style.display, "none", "Board 1: position (2, 0) is empty, but my colour is not black. Black transparent stone must not be displayed.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: position (2, 0) is empty, but it's not my turn. White transparent stone must not be displayed.");
		// Board 2
			// Things that must remain untouched
			equal(this.gospeed2.shower.max_bound, this.gospeed2.size * STONE_SIZE + BOARD_BOUND, "Board 2: max_bound remained untouched.");
			// These are for gographic test swite
			notEqual(this.gospeed2.shower.grid[1][0], undefined, "Board 2: shower grid position [1][0] must not be undefined.");
			equal(this.gospeed2.shower.grid[1][0][0].className, "StoneW", "Board 2: current stone class name must be 'StoneW'.");
			equal(this.gospeed2.shower.grid[1][0][0].style.top, "35px", "Board 2: current stone must be positioned on top: 35px.");
			equal(this.gospeed2.shower.grid[1][0][0].style.left, "10px", "Board 2: current stone must be positioned on left: 10px.");
			equal(this.gospeed2.shower.grid[1][0][1].className, "Shadow", "Board 2: current shadow class name must be 'Shadow'.");
			equal(this.gospeed2.shower.grid[1][0][1].style.top, "37px", "Board 2: current shadow must be positioned on top: 37px.");
			equal(this.gospeed2.shower.grid[1][0][1].style.left, "12px", "Board 2: current shadow must be positioned on left: 12px.");
			equal(this.gospeed2.shower.ko.className, "Ko", "Board 2: shower ko class name is 'Ko'.");
			equal(this.gospeed2.shower.ko.style.display, "none", "Board 2: shower ko is not being displayed.");
			equal(this.gospeed2.shower.t_white.className, "StoneTW", "Board 2: shower transparent white stone's class name is 'StoneTW'.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: shower transparent white strone is not being displayed.");
			equal(this.gospeed2.shower.t_black.className, "StoneTB", "Board 2: shower transparent black stone's class name is 'StoneTB'.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: shower transparent white strone is not being displayed.");
			// Mouse move
			triggerMouseMove(this.gospeed2.shower.div_board, 1, 1);
			equal(this.gospeed2.shower.t_black.style.display, "none", "Board 2: position (1, 1) has a stone, black transparent stone must not be displayed.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: position (1, 1) has a stone, white transparent stone must not be displayed.");
			triggerMouseMove(this.gospeed2.shower.div_board, 2, 0);
			equal(this.gospeed2.shower.t_black.style.display, "block", "Board 1: position (2, 0) is empty and it's my turn. Black transparent stone must be displayed.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 1: position (2, 0) is empty, but my colour is not white. White transparent stone must not be displayed.");

	// Play
	this.gospeed2.play(0, 2);
		// Board 1
			// Things that must remain untouched
			equal(this.gospeed.shower.max_bound, this.gospeed.size * STONE_SIZE + BOARD_BOUND, "Board 1: max_bound remained untouched.");
			// These are for gographic test swite
			notEqual(this.gospeed.shower.grid[0][2], undefined, "Board 1: shower grid position [0][2] must not be undefined.");
			equal(this.gospeed.shower.grid[0][2][0].className, "StoneB", "Board 1: current stone class name must be 'StoneB'.");
			equal(this.gospeed.shower.grid[0][2][0].style.top, "10px", "Board 1: current stone must be positioned on top: 10px.");
			equal(this.gospeed.shower.grid[0][2][0].style.left, "60px", "Board 1: current stone must be positioned on left: 60px.");
			equal(this.gospeed.shower.grid[0][2][1].className, "Shadow", "Board 1: current shadow class name must be 'Shadow'.");
			equal(this.gospeed.shower.grid[0][2][1].style.top, "12px", "Board 1: current shadow must be positioned on top: 12px.");
			equal(this.gospeed.shower.grid[0][2][1].style.left, "62px", "Board 1: current shadow must be positioned on left: 62px.");
			equal(this.gospeed.shower.ko.className, "Ko", "Board 1: shower ko class name is 'Ko'.");
			equal(this.gospeed.shower.ko.style.display, "none", "Board 1: shower ko is not being displayed.");
			equal(this.gospeed.shower.t_white.className, "StoneTW", "Board 1: shower transparent white stone's class name is 'StoneTW'.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: shower transparent white strone is not being displayed.");
			equal(this.gospeed.shower.t_black.className, "StoneTB", "Board 1: shower transparent black stone's class name is 'StoneTB'.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: shower transparent white strone is not being displayed.");
			// Mouse move
			triggerMouseMove(this.gospeed.shower.div_board, 1, 1);
			equal(this.gospeed.shower.t_black.style.display, "none", "Board 1: position (1, 1) has a stone, black transparent stone must not be displayed.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: position (1, 1) has a stone, white transparent stone must not be displayed.");
			triggerMouseMove(this.gospeed.shower.div_board, 2, 0);
			equal(this.gospeed.shower.t_black.style.display, "none", "Board 1: position (2, 0) is empty, but my colour is not black. Black transparent stone must not be displayed.");
			equal(this.gospeed.shower.t_white.style.display, "block", "Board 1: position (2, 0) is empty and it's my turn. White transparent stone must be displayed.");
		// Board 2
			// Things that must remain untouched
			equal(this.gospeed2.shower.max_bound, this.gospeed2.size * STONE_SIZE + BOARD_BOUND, "Board 2: max_bound remained untouched.");
			// These are for gographic test swite
			notEqual(this.gospeed2.shower.grid[0][2], undefined, "Board 2: shower grid position [0][2] must not be undefined.");
			equal(this.gospeed2.shower.grid[0][2][0].className, "StoneB", "Board 2: current stone class name must be 'StoneB'.");
			equal(this.gospeed2.shower.grid[0][2][0].style.top, "10px", "Board 2: current stone must be positioned on top: 10px.");
			equal(this.gospeed2.shower.grid[0][2][0].style.left, "60px", "Board 2: current stone must be positioned on left: 60px.");
			equal(this.gospeed2.shower.grid[0][2][1].className, "Shadow", "Board 2: current shadow class name must be 'Shadow'.");
			equal(this.gospeed2.shower.grid[0][2][1].style.top, "12px", "Board 2: current shadow must be positioned on top: 12px.");
			equal(this.gospeed2.shower.grid[0][2][1].style.left, "62px", "Board 2: current shadow must be positioned on left: 62px.");
			equal(this.gospeed2.shower.ko.className, "Ko", "Board 2: shower ko class name is 'Ko'.");
			equal(this.gospeed2.shower.ko.style.display, "none", "Board 2: shower ko is not being displayed.");
			equal(this.gospeed2.shower.t_white.className, "StoneTW", "Board 2: shower transparent white stone's class name is 'StoneTW'.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: shower transparent white strone is not being displayed.");
			equal(this.gospeed2.shower.t_black.className, "StoneTB", "Board 2: shower transparent black stone's class name is 'StoneTB'.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: shower transparent white strone is not being displayed.");
			// Mouse move
			triggerMouseMove(this.gospeed2.shower.div_board, 1, 1);
			equal(this.gospeed2.shower.t_black.style.display, "none", "Board 2: position (1, 1) has a stone, black transparent stone must not be displayed.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: position (1, 1) has a stone, white transparent stone must not be displayed.");
			triggerMouseMove(this.gospeed2.shower.div_board, 2, 0);
			equal(this.gospeed2.shower.t_black.style.display, "none", "Board 1: position (2, 0) is empty but it's not my turn. Black transparent stone must not be displayed.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 1: position (2, 0) is empty, but my colour is not white. White transparent stone must not be displayed.");

	// Play
	this.gospeed.play(0, 1);
		// Board 1
			// Things that must remain untouched
			equal(this.gospeed.shower.max_bound, this.gospeed.size * STONE_SIZE + BOARD_BOUND, "Board 1: max_bound remained untouched.");
			// These are for gographic test swite
			notEqual(this.gospeed.shower.grid[0][1], undefined, "Board 1: shower grid position [0][1] must not be undefined.");
			equal(this.gospeed.shower.grid[0][1][0].className, "StoneW", "Board 1: current stone class name must be 'StoneW'.");
			equal(this.gospeed.shower.grid[0][1][0].style.top, "10px", "Board 1: current stone must be positioned on top: 10px.");
			equal(this.gospeed.shower.grid[0][1][0].style.left, "35px", "Board 1: current stone must be positioned on left: 35px.");
			equal(this.gospeed.shower.grid[0][1][1].className, "Shadow", "Board 1: current shadow class name must be 'Shadow'.");
			equal(this.gospeed.shower.grid[0][1][1].style.top, "12px", "Board 1: current shadow must be positioned on top: 12px.");
			equal(this.gospeed.shower.grid[0][1][1].style.left, "37px", "Board 1: current shadow must be positioned on left: 37px.");
			equal(this.gospeed.shower.ko.className, "Ko", "Board 1: shower ko class name is 'Ko'.");
			equal(this.gospeed.shower.ko.style.display, "none", "Board 1: shower ko is not being displayed.");
			equal(this.gospeed.shower.t_white.className, "StoneTW", "Board 1: shower transparent white stone's class name is 'StoneTW'.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: shower transparent white strone is not being displayed.");
			equal(this.gospeed.shower.t_black.className, "StoneTB", "Board 1: shower transparent black stone's class name is 'StoneTB'.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: shower transparent white strone is not being displayed.");
			// Mouse move
			triggerMouseMove(this.gospeed.shower.div_board, 1, 1);
			equal(this.gospeed.shower.t_black.style.display, "none", "Board 1: position (1, 1) has a stone, black transparent stone must not be displayed.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: position (1, 1) has a stone, white transparent stone must not be displayed.");
			triggerMouseMove(this.gospeed.shower.div_board, 2, 0);
			equal(this.gospeed.shower.t_black.style.display, "none", "Board 1: position (2, 0) is empty, but my colour is not black. Black transparent stone must not be displayed.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: position (2, 0) is empty, but it's not my turn. White transparent stone must not be displayed.");
		// Board 2
			// Things that must remain untouched
			equal(this.gospeed2.shower.max_bound, this.gospeed2.size * STONE_SIZE + BOARD_BOUND, "Board 2: max_bound remained untouched.");
			// These are for gographic test swite
			notEqual(this.gospeed2.shower.grid[0][1], undefined, "Board 2: shower grid position [0][1] must not be undefined.");
			equal(this.gospeed2.shower.grid[0][1][0].className, "StoneW", "Board 2: current stone class name must be 'StoneW'.");
			equal(this.gospeed2.shower.grid[0][1][0].style.top, "10px", "Board 2: current stone must be positioned on top: 10px.");
			equal(this.gospeed2.shower.grid[0][1][0].style.left, "35px", "Board 2: current stone must be positioned on left: 35px.");
			equal(this.gospeed2.shower.grid[0][1][1].className, "Shadow", "Board 2: current shadow class name must be 'Shadow'.");
			equal(this.gospeed2.shower.grid[0][1][1].style.top, "12px", "Board 2: current shadow must be positioned on top: 12px.");
			equal(this.gospeed2.shower.grid[0][1][1].style.left, "37px", "Board 2: current shadow must be positioned on left: 37px.");
			equal(this.gospeed2.shower.ko.className, "Ko", "Board 2: shower ko class name is 'Ko'.");
			equal(this.gospeed2.shower.ko.style.display, "none", "Board 2: shower ko is not being displayed.");
			equal(this.gospeed2.shower.t_white.className, "StoneTW", "Board 2: shower transparent white stone's class name is 'StoneTW'.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: shower transparent white strone is not being displayed.");
			equal(this.gospeed2.shower.t_black.className, "StoneTB", "Board 2: shower transparent black stone's class name is 'StoneTB'.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: shower transparent white strone is not being displayed.");
			// Mouse move
			triggerMouseMove(this.gospeed2.shower.div_board, 1, 1);
			equal(this.gospeed2.shower.t_black.style.display, "none", "Board 2: position (1, 1) has a stone, black transparent stone must not be displayed.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: position (1, 1) has a stone, white transparent stone must not be displayed.");
			triggerMouseMove(this.gospeed2.shower.div_board, 2, 0);
			equal(this.gospeed2.shower.t_black.style.display, "block", "Board 1: position (2, 0) is empty and it's my turn. Black transparent stone must be displayed.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 1: position (2, 0) is empty, but my colour is not white. White transparent stone must not be displayed.");

	// Play
	this.gospeed2.play(0, 0);
		// Board 1
			// Things that must remain untouched
			equal(this.gospeed.shower.max_bound, this.gospeed.size * STONE_SIZE + BOARD_BOUND, "Board 1: max_bound remained untouched.");
			// These are for gographic test swite
			notEqual(this.gospeed.shower.grid[0][0], undefined, "Board 1: shower grid position [0][0] must not be undefined.");
			equal(this.gospeed.shower.grid[0][0][0].className, "StoneB", "Board 1: current stone class name must be 'StoneB'.");
			equal(this.gospeed.shower.grid[0][0][0].style.top, "10px", "Board 1: current stone must be positioned on top: 10px.");
			equal(this.gospeed.shower.grid[0][0][0].style.left, "10px", "Board 1: current stone must be positioned on left: 10px.");
			equal(this.gospeed.shower.grid[0][0][1].className, "Shadow", "Board 1: current shadow class name must be 'Shadow'.");
			equal(this.gospeed.shower.grid[0][0][1].style.top, "12px", "Board 1: current shadow must be positioned on top: 12px.");
			equal(this.gospeed.shower.grid[0][0][1].style.left, "12px", "Board 1: current shadow must be positioned on left: 12px.");
			equal(this.gospeed.shower.ko.className, "Ko", "Board 1: shower ko class name is 'Ko'.");
			equal(this.gospeed.shower.ko.style.display, "block", "Board 1: shower ko is being displayed.");
			equal(this.gospeed.shower.ko.style.top, "10px", "Board 1: ko indicator must be positioned on top: 10px.");
			equal(this.gospeed.shower.ko.style.left, "35px", "Board 1: ko indicator must be positioned on left: 35px.");
			equal(this.gospeed.shower.t_white.className, "StoneTW", "Board 1: shower transparent white stone's class name is 'StoneTW'.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: shower transparent white strone is not being displayed.");
			equal(this.gospeed.shower.t_black.className, "StoneTB", "Board 1: shower transparent black stone's class name is 'StoneTB'.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: shower transparent white strone is not being displayed.");
			// Mouse move
			triggerMouseMove(this.gospeed.shower.div_board, 1, 1);
			equal(this.gospeed.shower.t_black.style.display, "none", "Board 1: position (1, 1) has a stone, black transparent stone must not be displayed.");
			equal(this.gospeed.shower.t_white.style.display, "none", "Board 1: position (1, 1) has a stone, white transparent stone must not be displayed.");
			triggerMouseMove(this.gospeed.shower.div_board, 2, 0);
			equal(this.gospeed.shower.t_black.style.display, "none", "Board 1: position (2, 0) is empty, but my colour is not black. Black transparent stone must not be displayed.");
			equal(this.gospeed.shower.t_white.style.display, "block", "Board 1: position (2, 0) is empty and it's my turn. White transparent stone must be displayed.");
		// Board 2
			// Things that must remain untouched
			equal(this.gospeed2.shower.max_bound, this.gospeed2.size * STONE_SIZE + BOARD_BOUND, "Board 2: max_bound remained untouched.");
			// These are for gographic test swite
			notEqual(this.gospeed2.shower.grid[0][0], undefined, "Board 2: shower grid position [0][0] must not be undefined.");
			equal(this.gospeed2.shower.grid[0][0][0].className, "StoneB", "Board 2: current stone class name must be 'StoneB'.");
			equal(this.gospeed2.shower.grid[0][0][0].style.top, "10px", "Board 2: current stone must be positioned on top: 35px.");
			equal(this.gospeed2.shower.grid[0][0][0].style.left, "10px", "Board 2: current stone must be positioned on left: 35px.");
			equal(this.gospeed2.shower.grid[0][0][1].className, "Shadow", "Board 2: current shadow class name must be 'Shadow'.");
			equal(this.gospeed2.shower.grid[0][0][1].style.top, "12px", "Board 2: current shadow must be positioned on top: 35px.");
			equal(this.gospeed2.shower.grid[0][0][1].style.left, "12px", "Board 2: current shadow must be positioned on left: 35px.");
			equal(this.gospeed2.shower.ko.className, "Ko", "Board 2: shower ko class name is 'Ko'.");
			equal(this.gospeed2.shower.ko.style.display, "block", "Board 2: shower ko is being displayed.");
			equal(this.gospeed2.shower.ko.style.top, "10px", "Board 1: ko indicator must be positioned on top: 10px.");
			equal(this.gospeed2.shower.ko.style.left, "35px", "Board 1: ko indicator must be positioned on left: 35px.");
			equal(this.gospeed2.shower.t_white.className, "StoneTW", "Board 2: shower transparent white stone's class name is 'StoneTW'.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: shower transparent white strone is not being displayed.");
			equal(this.gospeed2.shower.t_black.className, "StoneTB", "Board 2: shower transparent black stone's class name is 'StoneTB'.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: shower transparent white strone is not being displayed.");
			// Mouse move
			triggerMouseMove(this.gospeed2.shower.div_board, 1, 1);
			equal(this.gospeed2.shower.t_black.style.display, "none", "Board 2: position (1, 1) has a stone, black transparent stone must not be displayed.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 2: position (1, 1) has a stone, white transparent stone must not be displayed.");
			triggerMouseMove(this.gospeed2.shower.div_board, 2, 0);
			equal(this.gospeed2.shower.t_black.style.display, "none", "Board 1: position (2, 0) is empty but it's not my turn. Black transparent stone must not be displayed.");
			equal(this.gospeed2.shower.t_white.style.display, "none", "Board 1: position (2, 0) is empty, but my colour is not white. White transparent stone must not be displayed.");

	this.gospeed.shower.clean_t_stones();
	this.gospeed2.shower.clean_t_stones();
});


