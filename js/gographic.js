var STONE_SIZE = 25;
var BOARD_BOUND = 10;
var SHADOW_LEFT = 3;
var SHADOW_TOP = 1;
var SHADOW_SIDE = -1; // 1 for right, -1 for left
var MOUSE_ADJUST_Y = 0;

function GoGraphic(game, args) {
	this.init.call(this, game, args);
}

GoGraphic.prototype = {
	init: function(game, args) {
		// Setup
		this.game = game;

		// Validation
		this.validate_and_load_divs(args);

		// Grid
		this.grid = Array(this.game.board.size);
		for (var row = 0, size = this.game.board.size; row < size ; row++) {
			this.grid[row] = Array(size);
		}

		// Board Bound
		this.max_bound = this.game.board.size * STONE_SIZE + BOARD_BOUND;
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
		shadow.style.left = (stoneLeft + SHADOW_SIDE * SHADOW_LEFT) + "px";
		shadow.style.top = (stoneTop + SHADOW_TOP) + "px";
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

	place_last_stone_wait_marker: function(put) {
		this.clear_last_stone_markers();
		this.last_stone_wait[put.color].style.left = (put.col * STONE_SIZE + BOARD_BOUND) + "px";
		this.last_stone_wait[put.color].style.top = (put.row * STONE_SIZE + BOARD_BOUND) + "px";
		this.last_stone_wait[put.color].style.display = "block";
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
		this.last_stone_wait["W"].style.display = "none";
		this.last_stone_wait["B"].style.display = "none";
	},

	confirm_play: function(put) {
		this.place_last_stone_marker(put);
	},

	place_coord_marker: function(row, col) {
		this.coord_marker.style.left = (col * STONE_SIZE + BOARD_BOUND) + "px";
		this.coord_marker.style.top = (row * STONE_SIZE + BOARD_BOUND) + "px";
		this.coord_marker.style.display = "block";
	},

	clear_coord_marker: function() {
		this.coord_marker.style.display = "none";
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
		if (play && play.ko) {
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

	draw_play: function(play, wait) {
		this.clear_last_stone_markers();
		if (play instanceof FreePlay) {
			for (var s = 0, ls = play.remove.length; s < ls; ++s) {
				this.remove_stone(play.remove[s].row, play.remove[s].col);
			}
			for (var s = 0, ls = play.put.length; s < ls; ++s) {
				this.put_stone(play.put[s].color, play.put[s].row, play.put[s].col);
			}
		} else if (play instanceof Play) {
			this.put_stone(play.put.color, play.put.row, play.put.col);
			if (wait) {
				this.place_last_stone_wait_marker(play.put);
			} else {
				this.place_last_stone_marker(play.put);
			}
			for (var s = 0, ls = play.remove.length; s < ls; ++s) {
				this.remove_stone(play.remove[s].row, play.remove[s].col);
			}
			this.refresh_ko(play);
		} else if (play instanceof Pass) {
			this.refresh_ko(play);
		}
	},

	undraw_play: function(play) {
		if (play instanceof FreePlay) {
			for (var s = 0, ls = play.put.length; s < ls; ++s) {
				this.remove_stone(play.put[s].row, play.put[s].col);
			}
			for (var s = 0, ls = play.remove.length; s < ls; ++s) {
				this.put_stone(play.remove[s].color, play.remove[s].row, play.remove[s].col);
			}
		} else if (play instanceof Play) {
			this.remove_stone(play.put.row, play.put.col);
			for (var s = 0, ls = play.remove.length; s < ls; ++s) {
				this.put_stone(play.remove[s].color, play.remove[s].row, play.remove[s].col);
			}
		}
		this.clear_last_stone_markers();
	},

	draw_number: function(play, num) {
		this.clear_last_stone_markers();
		if (play instanceof Play) {
			if (play.put) {
				var pos = this.grid[play.put.row][play.put.col];
				if (pos != undefined && pos.stone != undefined) {
					pos.stone.innerHTML = num;
				}
			}
		}
	},

	update_captures: function(play) {
		if (play != undefined && play.captured != undefined) {
			if (this.div_captured_w != undefined) {
				this.div_captured_w.innerHTML = play.captured["W"];
			}
			if (this.div_captured_b != undefined) {
				this.div_captured_b.innerHTML = play.captured["B"];
			}
		} else {
			if (this.div_captured_w != undefined) {
				this.div_captured_w.innerHTML = "0";
			}
			if (this.div_captured_b != undefined) {
				this.div_captured_b.innerHTML = "0";
			}
		}
	},

	update_move_number: function(node) {
		if (this.div_move_number != undefined) {
			if (node != undefined && node.turn_number != undefined) {
				this.div_move_number.innerHTML = node.turn_number;
			}
		}
	},

	// Pick score result and write it in corresponding divs
	update_score: function(score) {
		if (score != undefined) {
			if (this.div_score_w != undefined) {
				this.div_score_w.innerHTML = score["W"];
			}
			if (this.div_score_b != undefined) {
				this.div_score_b.innerHTML = score["B"];
			}
		} else {
			if (this.div_score_w != undefined) {
				this.div_score_w.innerHTML = "";
			}
			if (this.div_score_b != undefined) {
				this.div_score_b.innerHTML = "";
			}
		}
	},

	// Pick game result and write it in corresponding div
	update_result: function(result) {
		if (this.div_result != undefined) {
			if (result != undefined) {
				this.div_result.innerHTML = result;
			} else {
				this.div_result.innerHTML = "";
			}
		}
	},

	// Pick game actual move comments and write them in corresponding div
	update_comments: function() {
		if (this.div_comments != undefined) {
			var node = this.game.game_tree.actual_move;
			if (node.comments != undefined && node.turn_number != undefined) {
				this.div_comments.innerHTML = '<strong>Move ' + node.turn_number + '</strong><br />' + node.comments.replace(/(\r\n|\n|\r)/gm,"<br />");
			} else {
				this.div_comments.innerHTML = '';
			}
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
		if (target.t_stone != undefined) {
			this.div_board.removeChild(target.t_stone);
		}
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
		for (var row = 0, size = this.game.board.size; row < size ; row++) {
			for (var col = 0; col < size; col++) {
				this.remove_little_stone(row, col);
			}
		}
	},

	binder: function (method, object, args) {
		return function(orig_args) { method.apply(object, [orig_args].concat(args)); };
	},

	click_handler: function(mouse) {
		if (mouse) {
			event = mouse;
		}
		if ('pageX' in event) { // all browsers except IE before version 9
			var pageX = event.pageX;
			var pageY = event.pageY + MOUSE_ADJUST_Y;
		} else {  // IE before version 9
			var pageX = event.clientX + document.documentElement.scrollLeft;
			var pageY = event.clientY + document.documentElement.scrollTop + MOUSE_ADJUST_Y;
		}

		var boundedX = pageX - this.div_board.offsetLeft + 1;
		var boundedY = pageY - this.div_board.offsetTop + 1;
		if (boundedX > BOARD_BOUND && boundedX < this.max_bound && boundedY > BOARD_BOUND && boundedY < this.max_bound) {
			var gridX = parseInt((boundedX - BOARD_BOUND) / STONE_SIZE, 10);
			var gridY = parseInt((boundedY - BOARD_BOUND) / STONE_SIZE, 10);

			// XXX TODO FIXME RGF WTF IS THIS DOING HERE?!!?
			if (this.game.callbacks.rgf_board_click != undefined) {
				var bOK = true;
				bOK = bOK && (this.game.mode == "play");
				bOK = bOK && !event.shiftKey && !event.ctrlKey;
				bOK = bOK && this.game.setup_play(gridY, gridX);
				if (bOK) {
					if (!this.game.callbacks.rgf_board_click(gridY, gridX)) {
						return false;
					}
				} else {
					return false;
				}
			}
			// WOHAAAAAAA

			this.game.play(gridY, gridX, event.shiftKey, event.ctrlKey);
		}
	},

	mousemove_handler: function(mouse) {
		if (!this.game.connected) {
			return false;
		}

		if (mouse) {
			event = mouse;
		}
		if ('pageX' in event) { // all browsers except IE before version 9
			var pageX = event.pageX;
			var pageY = event.pageY + MOUSE_ADJUST_Y;
		} else {  // IE before version 9
			var pageX = event.clientX + document.documentElement.scrollLeft;
			var pageY = event.clientY + document.documentElement.scrollTop + MOUSE_ADJUST_Y;
		}

		var t_stone;

		if (this.game.mode == "count" || (this.game.mode == "count_online" && this.game.my_colour != "O")) {
			this.clean_t_stones();
			var boundedX = pageX - this.div_board.offsetLeft + 1;
			var boundedY = pageY - this.div_board.offsetTop + 1;
			if (boundedX <= BOARD_BOUND || boundedX >= this.max_bound || boundedY <= BOARD_BOUND || boundedY >= this.max_bound) {
				return false;
			}

			var col = parseInt((boundedX - BOARD_BOUND) / STONE_SIZE, 10);
			var row = parseInt((boundedY - BOARD_BOUND) / STONE_SIZE, 10);

			var tmp_color = this.game.board.get_pos(row, col);
			if (tmp_color == "B") {
				if (event.shiftKey) {
					t_stone = this.revive_b;
				} else {
					t_stone = this.t_little_white;
				}
			} else if (tmp_color == "W") {
				if (event.shiftKey) {
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
				case "variation":
					if (this.game.get_next_move() == "B") {
						t_stone = this.t_black;
					} else {
						t_stone = this.t_white;
					}
				break;
				case "play_online":
					if (this.game.is_my_turn()) {
						if (this.game.get_next_move() == "B") {
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

			var boundedX = pageX - this.div_board.offsetLeft + 1;
			var boundedY = pageY - this.div_board.offsetTop + 1;
			if (boundedX <= BOARD_BOUND || boundedX >= this.max_bound || boundedY <= BOARD_BOUND || boundedY >= this.max_bound) {
				t_stone.style.display = "none";
				return false;
			}

			var col = parseInt((boundedX - BOARD_BOUND) / STONE_SIZE, 10);
			var row = parseInt((boundedY - BOARD_BOUND) / STONE_SIZE, 10);

			if (this.game.board.get_pos(row, col) != undefined) {
				t_stone.style.display = "none";
				return false;
			}

			if (this.game.board.pos_is_ko(row, col)) {
				t_stone.style.display = "none";
				return false;
			}

			var tmp_play = new Play(this.game.get_next_move(), row, col);
			this.game.board.play_eat(tmp_play);
			if (this.game.board.play_check_suicide(tmp_play)) {
				t_stone.style.display = "none";
				return false;
			}

			t_stone.style.left = (col * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.top = (row * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.display = "block";
		}
	},

	mouseout_handler: function(mouse) {
		if (mouse) {
			event = mouse;
		}
		var hide = false;
		if (event.relatedTarget == null) {
			this.clean_t_stones();
		} else {
			if (event.relatedTarget == this.div_board) {
				return;
			}
			if (event.relatedTarget.parentNode != this.div_board) {
				this.clean_t_stones();
			}
		}
	},

	update_clocks: function(remain) {
		function formatTime(seconds, show_mins) {
			var tmp_min;
			var tmp_sec;
			if (show_mins) {
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
			} else {
				if (seconds > 0) {
					tmp_sec = Math.floor(seconds);
					if (tmp_sec < 10) {
						tmp_sec = "0" + tmp_sec;
					}
				} else {
					tmp_sec = "00";
				}
				return tmp_sec;
			}
		}

		var timer = this.game.timer;
		var color_arr = [BLACK, WHITE];

		switch (timer.system.name) {
			case "Absolute":
			case "Fischer":
			case "Bronstein":
				for (var color in color_arr) {
					color = color_arr[color];

					if (remain[color] != undefined) {
						this.handle_clock_sound(remain[color], color);
						this.format_clock_div(remain[color], color);
						this.write_clock_value(formatTime(remain[color] + 0.99, true), color);
						this.draw_t_stone_number(remain[color], color);
					}
				}
			break;
			case "Hourglass":
				for (var color in color_arr) {
					color = color_arr[color];

					if (remain[color] != undefined) {
						this.handle_clock_sound(remain[color].main_time, color);
						this.format_clock_div(remain[color].main_time, color);
						this.write_clock_value(formatTime(remain[color].main_time + 0.99, true), color);
						this.draw_t_stone_number(remain[color].main_time, color);
					}
				}
			break;
			case "Byoyomi":
				for (var color in color_arr) {
					color = color_arr[color];

					if (remain[color] != undefined) {
						// FIXME: this should be divided in two cases: main_time > 0 and main_time <= 0, periods must be a parameter and the handler should decide when to put "SD" as a label
						// To make that possible we may need to upgrade main_time timers to support a complete remain object.
						if (remain[color].main_time > 0) {
							this.handle_clock_sound(remain[color].main_time, color);
							this.format_clock_div(remain[color].main_time, color);
							this.write_clock_value(formatTime(remain[color].main_time + 0.99, true), color);
							this.draw_t_stone_number(remain[color].main_time, color);
						} else if (remain[color].periods <= 1) {
							this.handle_clock_sound(remain[color].period_time, color);
							this.format_clock_div(remain[color].period_time, color);
							this.write_clock_value(formatTime(remain[color].period_time + 0.99) + ' SD', color);
							this.draw_t_stone_number(remain[color].period_time, color);
						} else {
							this.handle_clock_sound(remain[color].period_time, color);
							this.format_clock_div(remain[color].period_time, color);
							this.write_clock_value(formatTime(remain[color].period_time + 0.99) + ' (' + remain[color].periods + ')', color);
							this.draw_t_stone_number(remain[color].period_time, color);
						}
					}
				}
			break;
			case "Canadian":
				for (var color in color_arr) {
					color = color_arr[color];

					if (remain[color] != undefined) {
						if (remain[color].main_time > 0) {
							this.write_clock_value(formatTime(remain[color].main_time + 0.99, true), color);
						} else {
							this.write_clock_value(formatTime(remain[color].period_time + 0.99, true) + ' / ' + remain[color].period_stones, color);
						}
					}
				}
			break;

		}
	},

	handle_clock_sound: function(remain, color) {
		if (typeof KAYAGLOBAL !== 'undefined') {
			if (this.game.is_my_turn() && this.game.my_colour == color) {
				var rc = Math.floor(remain);
				if (!KAYAGLOBAL.is_playing) {
					// FIXME: want to find the way to not play countdown on byoyomi main time but yes on period time...
					if (remain > 0 && remain < 11) {
						var start = 10 - rc;
						var delay = (remain - rc) * 1000;
						return KAYAGLOBAL.delayed_play_sound("countdown_sound", start, delay);
					}
					if (remain > 60 && remain < 61) {
						var delay = (remain - rc) * 1000;
						return KAYAGLOBAL.delayed_play_sound("oneminute", 0, delay);
					}
					if (remain > 300 && remain < 301) {
						var delay = (remain - rc) * 1000;
						return KAYAGLOBAL.delayed_play_sound("fiveminutes", 0, delay);
					}
				}
			}
		}
		return false;
	},

	draw_t_stone_number: function(remain, color) {
		var rc = Math.floor(remain + 0.99);
		if (this.my_colour != "O") {
			if (color == this.game.get_next_move()) {
				if (Math.floor(rc) > 0 && Math.floor(rc) <= 10) {
					if (color == BLACK) {
						this.t_black.innerHTML = Math.floor(rc);
					} else {
						this.t_white.innerHTML = Math.floor(rc);
					}
				} else {
					if (color == BLACK) {
						this.t_black.innerHTML = "";
					} else {
						this.t_white.innerHTML = "";
					}
				}
			}
		}
	},

	format_clock_div: function(remain, color) {
		if (color != undefined && remain != undefined) {
			var rc = Math.floor(remain + 0.99);
			var div = this.div_clocks[color];
			if (div != undefined) {
				if (color == this.game.get_next_move()) {
					if (remain <= 0) {
						div.style.color = "#800";
					} else if (rc > 0 && rc <= 10) {
						if (rc % 2 == 0) {
							div.style.color = "#EEE";
						} else {
							div.style.color = "";
						}
					} else {
						div.style.color = "";
					}
				} else {
					div.style.color = "";
				}
			}
		}
	},

	write_clock_value: function(value, color) {
		if (color != undefined && this.div_clocks[color] != undefined) {
			this.div_clocks[color].innerHTML = value;
		}
	},

	render: function() {
		switch(this.game.board.size) {
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
		(new Image()).src = tmp_path + "img/last_stone_wait_w.gif";
		(new Image()).src = tmp_path + "img/last_stone_wait_b.gif";
		(new Image()).src = tmp_path + "img/little_white.png";
		(new Image()).src = tmp_path + "img/little_black.png";
		(new Image()).src = tmp_path + "img/t_little_white.png";
		(new Image()).src = tmp_path + "img/t_little_black.png";

		// Transparent Stones
		this.t_white = this.create_elem("div", "StoneTW", true);
		this.t_black = this.create_elem("div", "StoneTB", true);
		this.t_little_white = this.create_elem("div", "LittleStoneTW", true);
		this.t_little_black = this.create_elem("div", "LittleStoneTB", true);

		// Revive stones
		this.revive_w = this.create_elem("div", "ReviveStoneW", true);
		this.revive_b = this.create_elem("div", "ReviveStoneB", true);

		// Last stone markers
		this.last_stone = [];
		this.last_stone["W"] = this.create_elem("div", "LastStoneW", true);
		this.last_stone["B"] = this.create_elem("div", "LastStoneB", true);

		// Last stone wait markers
		this.last_stone_wait = [];
		this.last_stone_wait["W"] = this.create_elem("div", "LastStoneWaitW", true);
		this.last_stone_wait["B"] = this.create_elem("div", "LastStoneWaitB", true);

		// Ko
		this.ko = this.create_elem("div", "Ko");

		// Coord Marker
		this.coord_marker = this.create_elem("div", "CoordMarker", true);

		// Bind mouse handlers
		this.div_board.onclick = this.binder(this.click_handler, this, null);
		this.div_board.onmousemove = this.binder(this.mousemove_handler, this, null);
		this.div_board.onmouseout = this.binder(this.mouseout_handler, this, null);

		// Captures
		this.update_captures(this.game.game_tree.actual_move.play);

		// Move Number
		this.update_move_number(this.game.game_tree.actual_move);

		// Comments
		this.update_comments();
	},

	create_elem: function(sTag, sClass, bHidden) {
		var elem = document.createElement(sTag);
		elem.className = sClass;
		if (bHidden) {
			elem.style.display = "none";
		}
		this.div_board.appendChild(elem);
		return elem;
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
		this.grid = Array(this.game.board.size);
		for (var row = 0 ; row < this.game.board.size ; row++) {
			this.grid[row] = Array(this.game.board.size);
		}
		this.max_bound = this.game.board.size * STONE_SIZE + BOARD_BOUND;
		/*
		this.t_white = undefined;
		this.t_black = undefined;
		this.ko = undefined;
		*/
		this.div_board.innerHTML = "";
	},

	redraw: function() {
		this.clear();
		this.render();
		var color;
		for (var i = 0, li = this.game.board.size; i < li; ++i) {
			for (var j = 0; j < li; ++j) {
				color = this.game.board.grid[i][j];
				if (color != undefined) {
					this.put_stone(color, i, j);
				}
			}
		}
		var node = this.game.game_tree.actual_move;
		this.refresh_ko(node.play);
		this.update_captures(node.play);
		this.update_move_number(node);
		this.update_comments();
		if (node.play instanceof Play) {
			this.place_last_stone_marker(node.play.put);
		}
	},

	test_and_store_div: function(source, source_name, target, target_name, empty) {
		var tmp;
		if (source[source_name] !== undefined) {
			tmp = document.getElementById(source[source_name]);
			if (tmp) {
				if (empty === true) {
					tmp.innerHTML = "";
				}
				target[target_name] = tmp;
			} else {
				throw new Error("GoGraphic: error finding '" + source_name + "' with id '" + source[source_name] + "'.");
			}
		}
	},

	validate_and_load_divs: function(args) {
		this.test_and_store_div(args, "div_id_board", this, "div_board", true);
		this.div_clocks = {};
		if (args.time_settings != undefined) {
			this.test_and_store_div(args.time_settings, "div_id_clock_w", this.div_clocks, WHITE, true);
			this.test_and_store_div(args.time_settings, "div_id_clock_b", this.div_clocks, BLACK, true);
		}
		this.test_and_store_div(args, "div_id_captured_w", this, "div_captured_w", true);
		this.test_and_store_div(args, "div_id_captured_b", this, "div_captured_b", true);
		this.test_and_store_div(args, "div_id_score_w", this, "div_score_w");
		this.test_and_store_div(args, "div_id_score_b", this, "div_score_b");
		this.test_and_store_div(args, "div_id_result", this, "div_result");
		this.test_and_store_div(args, "div_id_comments", this, "div_comments");
		this.test_and_store_div(args, "div_id_move_number", this, "div_move_number");
	},

};
