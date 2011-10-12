var STONE_SIZE = 25;
var BOARD_BOUND = 10;
var SHADOW_DISTANCE = 2;

function GoGraphic(game) {
	this.init.call(this, game);
}

GoGraphic.prototype = {
	init: function(game) {
		this.game = game;
		this.validate_and_load_divs();
		this.grid = Array(this.game.size);
		for (var row = 0, size = this.game.size; row < size ; row++) {
			this.grid[row] = Array(size);
		}
		this.max_bound = this.game.size * STONE_SIZE + BOARD_BOUND;
	},

	put_stone: function(color, row, col) {
		var stone = document.createElement("div");
		var stoneLeft = col * STONE_SIZE + BOARD_BOUND;
		var stoneTop = row * STONE_SIZE + BOARD_BOUND;
		stone.className = "Stone" + color;
		stone.style.left = stoneLeft + "px";
		stone.style.top = stoneTop + "px";
		this.div_board.appendChild(stone);

		var shadow = document.createElement("div");
		shadow.className = "Shadow";
		shadow.style.left = (stoneLeft + SHADOW_DISTANCE) + "px";
		shadow.style.top = (stoneTop + SHADOW_DISTANCE) + "px";
		this.div_board.appendChild(shadow);

		this.clean_t_stones();
		this.grid[row][col] = {
			stone: stone,
			shadow: shadow,
		};
	},

	put_little_stone: function(color, row, col) {
		var stone = document.createElement("div");
		var stoneLeft = col * STONE_SIZE + BOARD_BOUND;
		var stoneTop = row * STONE_SIZE + BOARD_BOUND;
		stone.className = "LittleStone" + color;
		stone.style.left = stoneLeft + "px";
		stone.style.top = stoneTop + "px";
		this.div_board.appendChild(stone);

		if (this.grid[row][col] == undefined) {
			this.grid[row][col] = {
				little_stone: stone,
			}
		} else {
			this.grid[row][col].little_stone = stone;
		}
	},

	place_last_stone_marker: function(put) {
		this.clear_last_stone_markers();
		this.last_stone[put.color].style.left = (put.col * STONE_SIZE + BOARD_BOUND) + "px";
		this.last_stone[put.color].style.top = (put.row * STONE_SIZE + BOARD_BOUND) + "px";
		this.last_stone[put.color].style.display = "block";
	},

	clear_last_stone_markers: function() {
		this.last_stone["W"].style.display = "none";
		this.last_stone["B"].style.display = "none";
	},

	place_ko: function(ko) {
		this.ko.style.left = (ko.col * STONE_SIZE + BOARD_BOUND) + "px";
		this.ko.style.top = (ko.row * STONE_SIZE + BOARD_BOUND) + "px";
		this.ko.style.display = "block";
	},

	clear_ko: function() {
		this.ko.style.display = "none";
	},

	refresh_ko: function(play) {
		if (play.ko) {
			this.place_ko(play.ko);
		} else {
			this.clear_ko();
		}
	},

	remove_stone: function(row, col) {
		var target = this.grid[row][col];
		if (target != undefined && target.stone != undefined && target.shadow != undefined) {
			this.div_board.removeChild(target.stone);
			this.div_board.removeChild(target.shadow);
			if (target.little_stone == undefined) {
				this.grid[row][col] = undefined;
			} else {
				target.stone = undefined;
				target.shadow = undefined;
			}
		}
	},

	remove_little_stone: function(row, col) {
		var target = this.grid[row][col];
		if (target != undefined && target.little_stone != undefined) {
			this.div_board.removeChild(target.little_stone);
			if (target.stone == undefined && target.shadow == undefined) {
				this.grid[row][col] = undefined;
			} else {
				target.little_stone = undefined;
			}
		}
	},

	draw_play: function(play) {
		if (play instanceof FreePlay) {
			for (var stone in play.remove) {
				this.remove_stone(play.remove[stone].row, play.remove[stone].col);
			}
			for (var stone in play.put) {
				this.put_stone(play.put[stone].color, play.put[stone].row, play.put[stone].col);
			}
			this.clear_last_stone_markers();
		} else {
			this.put_stone(play.put.color, play.put.row, play.put.col);
			this.place_last_stone_marker(play.put);
			for (var stone in play.remove) {
				this.remove_stone(play.remove[stone].row, play.remove[stone].col);
			}
			this.refresh_ko(play);
		}
	},

	undraw_play: function(play) {
		if (play instanceof FreePlay) {
			for (var stone in play.put) {
				this.remove_stone(play.put[stone].row, play.put[stone].col);
			}
			for (var stone in play.remove) {
				this.put_stone(play.remove[stone].color, play.remove[stone].row, play.remove[stone].col);
			}
		} else {
			this.remove_stone(play.put.row, play.put.col);
			for (var stone in play.remove) {
				this.put_stone(play.remove[stone].color, play.remove[stone].row, play.remove[stone].col);
			}
		}
		this.clear_last_stone_markers();
	},

	update_captures: function() {
		if (this.div_captured_w != undefined) {
			this.div_captured_w.innerHTML = this.game.captured["W"];
		}
		if (this.div_captured_b != undefined) {
			this.div_captured_b.innerHTML = this.game.captured["B"];
		}
	},

	draw_score: function(score) {
		for (var i = 0, li = score.groups.length; i < li; ++i) {
			var group = score.groups[i];
			var owner = group.owner;
			var coords = group.coords;
			if (owner == BLACK || owner == WHITE) {
				for (var j = 0, lj = coords.length; j < lj; ++j) {
					this.put_little_stone(owner, coords[j].row, coords[j].col);
				}
			}
		}
	},

	stone_dead: function(color, row, col) {
		this.grid[row][col].stone.style.display = "none";
		this.grid[row][col].shadow.style.display = "none";

		var stone = document.createElement("div");
		var stoneLeft = col * STONE_SIZE + BOARD_BOUND;
		var stoneTop = row * STONE_SIZE + BOARD_BOUND;
		stone.className = "StoneT" + color;
		stone.style.left = stoneLeft + "px";
		stone.style.top = stoneTop + "px";
		stone.style.display = "block";
		this.div_board.appendChild(stone);
		this.grid[row][col].t_stone = stone;
	},

	stone_revive: function(color, row, col) {
		var target = this.grid[row][col];
		this.div_board.removeChild(target.t_stone);
		target.t_stone = undefined;
		target.stone.style.display = "block";
		target.shadow.style.display = "block";
	},

	draw_dead_groups: function(dead_groups) {
		for (var i = 0, li = dead_groups.length; i < li; ++i) {
			var group = dead_groups[i];
			for (var j = 0, lj = group.length; j < lj; ++j) {
				this.stone_dead(group[j].color, group[j].row, group[j].col);
			}
		}
	},

	clear_dead_groups: function(dead_groups) {
		for (var i = 0, li = dead_groups.length; i < li; ++i) {
			var group = dead_groups[i];
			for (var j = 0, lj = group.length; j < lj; ++j) {
				this.stone_revive(group[j].color, group[j].row, group[j].col);
			}
		}
	},

	clear_score: function() {
		for (var row = 0, size = this.game.size; row < size ; row++) {
			for (var col = 0; col < size; col++) {
				this.remove_little_stone(row, col);
			}
		}
	},

	binder: function (method, object, args) {
		return function(orig_args) { method.apply(object, [orig_args].concat(args)); };
	},

	click_handler: function(click) {
		var boundedX = click.pageX - this.div_board.offsetLeft + 1;
		var boundedY = click.pageY - this.div_board.offsetTop + 1;
		if (boundedX > BOARD_BOUND && boundedX < this.max_bound && boundedY > BOARD_BOUND && boundedY < this.max_bound) {
			var gridX = parseInt((boundedX - BOARD_BOUND) / STONE_SIZE, 10);
			var gridY = parseInt((boundedY - BOARD_BOUND) / STONE_SIZE, 10);
			this.game.play(gridY, gridX, click.shiftKey);
		}
	},

	mousemove_handler: function(mouse) {
		var t_stone;

		if (this.game.mode == "count") {
			this.clean_t_stones();
			var boundedX = mouse.pageX - this.div_board.offsetLeft + 1;
			var boundedY = mouse.pageY - this.div_board.offsetTop + 1;
			if (boundedX <= BOARD_BOUND || boundedX >= this.max_bound || boundedY <= BOARD_BOUND || boundedY >= this.max_bound) {
				return false;
			}

			var col = parseInt((boundedX - BOARD_BOUND) / STONE_SIZE, 10);
			var row = parseInt((boundedY - BOARD_BOUND) / STONE_SIZE, 10);

			var tmp_color = this.game.get_pos(row, col);
			if (tmp_color == "B") {
				if (mouse.shiftKey) {
					t_stone = this.revive_b;
				} else {
					t_stone = this.t_little_white;
				}
			} else if (tmp_color == "W") {
				if (mouse.shiftKey) {
					t_stone = this.revive_w;
				} else {
					t_stone = this.t_little_black;
				}
			} else {
				return false;
			}
			t_stone.style.left = (col * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.top = (row * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.display = "block";
			return false;

		} else {

			switch (this.game.mode) {
				case "free":
					t_stone = this.t_white;
				break;
				case "play":
					if (this.game.next_move == "B") {
						t_stone = this.t_black;
					} else {
						t_stone = this.t_white;
					}
				break;
				case "play_online":
					if (this.game.is_my_turn()) {
						if (this.game.next_move == "B") {
							t_stone = this.t_black;
						} else {
							t_stone = this.t_white;
						}
					} else {
						t_stone = null;
					}
				break;
			}


			if (t_stone == null) {
				this.clean_t_stones();
				return false;
			}

			var boundedX = mouse.pageX - this.div_board.offsetLeft + 1;
			var boundedY = mouse.pageY - this.div_board.offsetTop + 1;
			if (boundedX <= BOARD_BOUND || boundedX >= this.max_bound || boundedY <= BOARD_BOUND || boundedY >= this.max_bound) {
				t_stone.style.display = "none";
				return false;
			}

			var col = parseInt((boundedX - BOARD_BOUND) / STONE_SIZE, 10);
			var row = parseInt((boundedY - BOARD_BOUND) / STONE_SIZE, 10);

			if (this.game.get_pos(row, col) != undefined) {
				t_stone.style.display = "none";
				return false;
			}

			if (this.game.pos_is_ko(row, col)) {
				t_stone.style.display = "none";
				return false;
			}

			var tmp_play = new Play(this.game.next_move, row, col);
			this.game.play_eat(tmp_play);
			if (this.game.play_check_suicide(tmp_play)) {
				t_stone.style.display = "none";
				return false;
			}

			t_stone.style.left = (col * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.top = (row * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.display = "block";
		}
	},

	mouseout_handler: function(mouse) {
		var hide = false;
		if (mouse.relatedTarget == null) {
			this.clean_t_stones();
		} else {
			if (mouse.relatedTarget == this.div_board) {
				return;
			}
			if (mouse.relatedTarget.parentNode != this.div_board) {
				this.clean_t_stones();
			}
		}
	},

	update_clocks: function(remain) {
		function formatTime(seconds) {
			var tmp_min;
			var tmp_sec;
			if (seconds > 0) {
				tmp_min = Math.floor(seconds / 60);
				tmp_sec = Math.floor(seconds - tmp_min * 60);
				if (tmp_min < 10) {
					tmp_min = "0" + tmp_min;
				}
				if (tmp_sec < 10) {
					tmp_sec = "0" + tmp_sec;
				}
			} else {
				tmp_min = "00";
				tmp_sec = "00";
			}
			return tmp_min + ":" + tmp_sec;
		}

		this.div_clock_w.innerHTML = formatTime(remain["W"]);
		this.div_clock_b.innerHTML = formatTime(remain["B"]);
	},

	render: function() {
		switch(this.game.size) {
			case 19:
				this.div_board.style.width = "495px";
				this.div_board.style.height = "495px";
				this.div_board.className = "OnlyBoard19";
			break;
			case 13:
				this.div_board.style.width = "346px";
				this.div_board.style.height = "346px";
				this.div_board.className = "OnlyBoard13";
			break;
			case 9:
				this.div_board.style.width = "246px";
				this.div_board.style.height = "246px";
				this.div_board.className = "OnlyBoard9";
			break;
		}
		this.div_board.style.position = "relative";

		// Image prefetch (dunno if this is the right place...)
		var tmp_path = "";
		if (this.game.server_path_gospeed_root != undefined) {
			tmp_path = this.game.server_path_gospeed_root;
		}
		(new Image()).src = tmp_path + "img/white.png";
		(new Image()).src = tmp_path + "img/black.png";
		(new Image()).src = tmp_path + "img/t_white.png";
		(new Image()).src = tmp_path + "img/t_black.png";
		(new Image()).src = tmp_path + "img/shadow.png";
		(new Image()).src = tmp_path + "img/last_stone_w.png";
		(new Image()).src = tmp_path + "img/last_stone_b.png";
		(new Image()).src = tmp_path + "img/little_white.png";
		(new Image()).src = tmp_path + "img/little_black.png";
		(new Image()).src = tmp_path + "img/t_little_white.png";
		(new Image()).src = tmp_path + "img/t_little_black.png";

		// Transparent Stones
		var t_white = document.createElement("div");
		t_white.className = "StoneTW";
		this.div_board.appendChild(t_white);
		t_white.style.display = "none";
		this.t_white = t_white;
		var t_black = document.createElement("div");
		t_black.className = "StoneTB";
		this.div_board.appendChild(t_black);
		t_black.style.display = "none";
		this.t_black= t_black;
		var t_little_black = document.createElement("div");
		t_little_black.className = "LittleStoneTB";
		this.div_board.appendChild(t_little_black);
		t_little_black.style.display = "none";
		this.t_little_black= t_little_black;
		var t_little_white = document.createElement("div");
		t_little_white.className = "LittleStoneTW";
		this.div_board.appendChild(t_little_white);
		t_little_white.style.display = "none";
		this.t_little_white= t_little_white;

		// Revive stones
		var revive_stone = document.createElement("div");
		revive_stone.className = "ReviveStoneW";
		revive_stone.style.display = "none";
		this.div_board.appendChild(revive_stone);
		this.revive_w = revive_stone;
		revive_stone = document.createElement("div");
		revive_stone.className = "ReviveStoneB";
		revive_stone.style.display = "none";
		this.div_board.appendChild(revive_stone);
		this.revive_b = revive_stone;

		// Last stone markers
		this.last_stone = [];
		var last_stone = document.createElement("div");
		last_stone.className = "LastStoneW";
		this.div_board.appendChild(last_stone);
		last_stone.style.display = "none";
		this.last_stone["W"] = last_stone;
		last_stone = document.createElement("div");
		last_stone.className = "LastStoneB";
		this.div_board.appendChild(last_stone);
		last_stone.style.display = "none";
		this.last_stone["B"] = last_stone;

		// Ko
		var ko = document.createElement("div");
		ko.className = "Ko";
		this.div_board.appendChild(ko);
		this.ko = ko;

		// Bind mouse handlers
		this.div_board.onclick = this.binder(this.click_handler, this, null);
		this.div_board.onmousemove = this.binder(this.mousemove_handler, this, null);
		this.div_board.onmouseout = this.binder(this.mouseout_handler, this, null);

		// Captures
		this.update_captures();
	},

	clean_t_stones: function() {
		this.t_white.style.display = "none";
		this.t_black.style.display = "none";
		this.t_little_white.style.display = "none";
		this.t_little_black.style.display = "none";
		this.revive_b.style.display = "none";
		this.revive_w.style.display = "none";
	},

	clear: function() {
		this.grid = Array(this.game.size);
		for (var row = 0 ; row < this.game.size ; row++) {
			this.grid[row] = Array(this.game.size);
		}
		this.max_bound = this.game.size * STONE_SIZE + BOARD_BOUND;
		/*
		this.t_white = undefined;
		this.t_black = undefined;
		this.ko = undefined;
		*/
		this.div_board.innerHTML = "";
	},

	validate_and_load_divs: function() {
		if (this.game.div_id_board != undefined) {
			this.div_board = document.getElementById(this.game.div_id_board);
			if (this.div_board) {
				this.div_board.innerHTML = "";
			} else {
				throw new Error("GoGraphic: error finding board div.");
			}
		}
		if (this.game.div_id_clock_w != undefined) {
			this.div_clock_w = document.getElementById(this.game.div_id_clock_w);
			if (this.div_clock_w) {
				this.div_clock_w.innerHTML = "";
			} else {
				throw new Error("GoGraphic: error finding white clock div.");
			}
		}
		if (this.game.div_id_clock_b != undefined) {
			this.div_clock_b = document.getElementById(this.game.div_id_clock_b);
			if (this.div_clock_b) {
				this.div_clock_b.innerHTML = "";
			} else {
				throw new Error("GoGraphic: error finding black clock div.");
			}
		}
		if (this.game.div_id_captured_w != undefined) {
			this.div_captured_w = document.getElementById(this.game.div_id_captured_w);
			if (this.div_captured_w) {
				this.div_captured_w.innerHTML = "";
			} else {
				throw new Error("GoGraphic: error finding white captured div.");
			}
		}
		if (this.game.div_id_captured_b != undefined) {
			this.div_captured_b = document.getElementById(this.game.div_id_captured_b);
			if (this.div_captured_b) {
				this.div_captured_b.innerHTML = "";
			} else {
				throw new Error("GoGraphic: error finding black captured div.");
			}
		}
	},

};
