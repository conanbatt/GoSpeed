var WHITE = "W";
var BLACK = "B";

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

		// Engine
		//this.engine = new HTMLEngine(this, args);
		this.engine = new Canvas2DEngine(this, args);
	},


/*
*   Board drawing primitives   *
                              */
	put_stone: function(color, row, col) {
		// Draw
		this.engine.clean_t_stones();
		var stones = this.engine.draw_stone(color, row, col);

		// Store stone register
		this.grid[row][col] = stones;
	},

	put_little_stone: function(color, row, col) {
		// Draw
		var stone = this.engine.draw_little_stone(color, row, col);

		// Create object if undefined
		if (this.grid[row][col] == undefined) {
			this.grid[row][col] = {};
		}

		// Store little stone register
		this.grid[row][col].little_stone = stone;
	},

	// Patched
	place_last_stone_marker: function(put) {
		this.engine.draw_last_stone_marker(put);
	},
	clear_last_stone_markers: function() {
		this.engine.clear_last_stone_markers();
	},
	place_coord_marker: function(row, col) {
		this.engine.draw_coord_marker(row, col);
	},
	clear_coord_marker: function() {
		this.engine.clear_coord_marker();
	},
	clean_t_stones: function() {
		this.engine.clean_t_stones();
	},

	remove_stone: function(row, col) {
		var target = this.grid[row][col];
		if (target != undefined) {
			this.engine.remove_stone(target);
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
			this.engine.remove_little_stone(target.little_stone);
			if (target.stone == undefined && target.shadow == undefined) {
				this.grid[row][col] = undefined;
			} else {
				target.little_stone = undefined;
			}
		}
	},

	draw_number: function(play, num) {
		this.engine.clear_last_stone_markers();
		if (play instanceof Play) {
			if (play.put) {
				var pos = this.grid[play.put.row][play.put.col];
				if (pos != undefined && pos.stone != undefined) {
					this.engine.draw_number(pos.stone, num);
				}
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
		// Hide original stone
		this.engine.hide_stone(this.grid[row][col].stone, this.grid[row][col].shadow);

		// Draw the dead one
		var t_stone = this.draw_transparent_stone(color, row, col);

		// Store register
		this.grid[row][col].t_stone = t_stone;
	},

	stone_revive: function(color, row, col) {
		// Remove stone if exists
		var target = this.grid[row][col];
		if (target.t_stone != undefined) {
			this.engine.remove_transparent_stone(target.t_stone);
		}

		// Clear register
		target.t_stone = undefined;

		// Show original stone
		this.engine.show_stone(target.stone, target.shadow);
	},

	render: function() {
		this.engine.render(this.game.board.size);

		// Captures
		this.update_captures(this.game.game_tree.actual_move.play);

		// Move Number
		this.update_move_number(this.game.game_tree.actual_move);

		// Comments
		this.update_comments();
	},

	clear: function(hard) {
		this.grid = Array(this.game.board.size);
		for (var row = 0 ; row < this.game.board.size ; row++) {
			this.grid[row] = Array(this.game.board.size);
		}
		this.engine.clear(hard);
	},


/*
*   Controls drawing primitives   *
                                 */
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


/*
*   Clock drawing primitives   *
                              */
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
					this.engine.draw_t_stone_number(color, Math.floor(rc));
				} else {
					this.engine.clear_t_stone_numbers();
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


/*
*   Helpers   *
             */
	confirm_play: function(put) {
		this.engine.draw_last_stone_marker(put);
	},

	refresh_ko: function(play) {
		if (play && play.ko) {
			this.engine.draw_ko(play.ko);
		} else {
			this.engine.clear_ko();
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
				this.engine.draw_last_stone_wait_marker(play.put);
			} else {
				this.engine.draw_last_stone_marker(play.put);
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

	redraw: function(hard) {
		this.clear(hard);
		if (hard) {
			this.render();
		}
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
			this.engine.draw_last_stone_marker(node.play.put);
		}
	},

	draw_variation_numbers: function() {
		var node = this.game.game_tree.actual_move;
		if (node.source == NODE_VARIATION) {
			while(node.prev && node.prev.source == NODE_VARIATION) {
				node = node.prev;
			}

			var num = 1;
			// XXX TODO FIXME: UGLY HARDCODED [0] -> i dont have last_next on variations...
			while(node.next[0]) {
				if (node.play) {
					this.engine.draw_number(node.play, num);
				}
				node = node.next[0];
				num++;
			}
			if (node.play) {
				this.engine.draw_number(node.play, num);
			}
		}
	},


/*
*   Validation   *
                */
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
