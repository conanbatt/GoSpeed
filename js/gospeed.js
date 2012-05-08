var TRACK_ONLINE = 0;
var TRACK_OFFLINE = 1;
var TRACK_VARIATION = 2;

function GoSpeed(args) {
	this.init.apply(this, [args]);
}

GoSpeed.prototype = {
	init: function() {
	// Validation
		this.validator = new GoValidate(arguments);
		var args = this.validator.clean_args;

	// Setup
		this.size = args.size;
		this.mode = args.mode;
		this.ruleset = args.ruleset;
		this.komi = args.komi;

	// Grids
		this.grid = Array(this.size);
		for (var row = 0 ; row < this.size ; row++) {
			this.grid[row] = Array(this.size);
		}

	// Divs
		// Board
		if (args.div_id_board != undefined) {
			this.div_id_board = args.div_id_board;
			// Read div contents
			var tmp_div = document.getElementById(args.div_id_board);
			if (tmp_div && tmp_div.innerHTML != "") {
				this.sgf = new SGFParser(tmp_div.innerHTML);
			}
		}
		// Time
		if (args.time_settings != undefined) {
			if (args.time_settings.div_id_clock_w != undefined) {
				this.div_id_clock_w = args.time_settings.div_id_clock_w;
			}
			if (args.time_settings.div_id_clock_b != undefined) {
				this.div_id_clock_b = args.time_settings.div_id_clock_b;
			}
		}
		// Captured
		if (args.div_id_captured_w != undefined) {
			this.div_id_captured_w = args.div_id_captured_w;
		}
		if (args.div_id_captured_b != undefined) {
			this.div_id_captured_b = args.div_id_captured_b;
		}
		// Score
		if (args.div_id_score_w != undefined) {
			this.div_id_score_w = args.div_id_score_w;
		}
		if (args.div_id_score_b != undefined) {
			this.div_id_score_b = args.div_id_score_b;
		}
		// Result
		if (args.div_id_result != undefined) {
			this.div_id_result = args.div_id_result;
		}
		// Comments
		if (args.div_id_comments != undefined) {
			this.div_id_comments = args.div_id_comments;
		}
		// Move Number
		if (args.div_id_move_number != undefined) {
			this.div_id_move_number = args.div_id_move_number;
		}

	// Timer
		if (args.time_settings != undefined) {
			this.setup_timer(args.time_settings);
		}

	// Shower
		// Define the showing engine
		if (args.shower != undefined) {
			if (args.shower == "basic") {
				this.shower = new GoShower(this);
			} else if (args.shower == "graphic") {
				this.shower = new GoGraphic(this);
			}
		}

	// GameTree
		this.game_tree = new GameTree(args.div_id_tree);
		this.div_id_tree = args.div_id_tree;

	// Online
		if (args.my_colour != undefined) {
			this.my_colour = args.my_colour;
		}
		if (args.my_nick != undefined) {
			this.my_nick = args.my_nick;
		}
		this.connected = (this.mode != "play_online" && this.mode != "count_online");

	// Tracks
		this.tracks = [];
		this.tracks[TRACK_ONLINE] = new Track(this.grid, this.game_tree.actual_move);
		this.actual_track = TRACK_ONLINE;

	// Game
		// TODO: turn count sucks monkey ass
		this.turn_count = 0;

	// Callbacks
		this.callbacks = args.callbacks || {};

	// Paths
		if (args.server_path_gospeed_root != undefined) {
			this.server_path_gospeed_root = args.server_path_gospeed_root;
		}
		if (args.server_path_absolute_url != undefined) {
			this.server_path_absolute_url = args.server_path_absolute_url;
		}
		if (args.server_path_game_move != undefined) {
			this.server_path_game_move = args.server_path_game_move;
		}
		if (args.server_path_game_end != undefined) {
			this.server_path_game_end = args.server_path_game_end;
		}

	// Render
		this.render();

	// Load SGF
		//this.load_sgf();
	},

//	Manage Board
	put_stone: function(color, row, col) {
		if (typeof color != "string") {
			throw new Error("Wrong type of color");
		}
		if (color != "B" && color != "W") {
			throw new Error("Wrong color");
		}
		if (row >= this.size || col >= this.size) {
			throw new Error("Stone out of board");
		}
		this.grid[row][col] = color;
	},

	remove_stone: function(row, col) {
		if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
			throw new Error("Position out of board");
		}
		this.grid[row][col] = undefined;
	},

	get_pos: function(row, col) {
		if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
			throw new Error("Position out of board");
		}
		return this.grid[row][col];
	},

	safe_get_pos: function(row, col) {
		if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
			return "";
		} else {
			return this.grid[row][col];
		}
	},

	pos_is_ko: function(row, col) {
		var ret = false;
		var ko = this.get_ko();
		if (ko != undefined) {
			if (ko.row == row && ko.col == col) {
				ret = true;
			}
		}
		return ret;
	},

//	Plays and Moves
	// Takes a play and spreads it's content to the grid (updates gospeed.ko)
	make_play: function(play) {
		if (play instanceof FreePlay) {
			for (var s = 0, ls = play.remove.length; s < ls; ++s) {
				this.remove_stone(play.remove[s].row, play.remove[s].col);
			}
			for (var s = 0, ls = play.put.length; s < ls; ++s) {
				this.put_stone(play.put[s].color, play.put[s].row, play.put[s].col);
			}
		} else if (play instanceof Play) {
			this.put_stone(play.put.color, play.put.row, play.put.col);
			for (var s = 0, ls = play.remove.length; s < ls; ++s) {
				this.remove_stone(play.remove[s].row, play.remove[s].col);
			}
		}
	},

	// Takes a play and undoes it's content to the grid (updates gospeed.ko)
	undo_play: function(play) {
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
	},

	// Takes a play and completes it's 'remove' property with the stones that would eat from the board.
	play_eat: function(play) {
		this.put_stone(play.put.color, play.put.row, play.put.col);

		var target_color = (play.put.color == "W" ? "B" : "W");
		var adj = this.get_touched(target_color, play.put.row, play.put.col);
		var chains = this.get_distinct_chains(adj);

		for (var c = 0, lc = chains.length; c < lc; ++c) {
			if (this.chain_is_restricted(chains[c])) {
				for (var s = 0, ls = chains[c].length; s < ls; ++s) {
					play.remove.push(new Stone(target_color, chains[c][s].row, chains[c][s].col));
				}
			}
		}

		this.remove_stone(play.put.row, play.put.col);
	},

	// Checks if the play triggers ko. Updates it's ko property.
	play_check_ko: function(play) {
		var is_ko = false;
		var tmp_play;
		this.make_play(play);
		if (play.remove.length == 1) {
			tmp_play = new Play(play.remove[0].color, play.remove[0].row, play.remove[0].col);
			this.play_eat(tmp_play);
			if (tmp_play.remove.length == 1) {
				if (play.put.equals(tmp_play.remove[0]) && tmp_play.put.equals(play.remove[0])) {
					is_ko = true;
				}
			}
		}
		this.undo_play(play);
		if (is_ko) {
			play.ko = {
				row: tmp_play.put.row,
				col: tmp_play.put.col,
			};
		} else {
			play.ko = undefined;
		}
	},

	get_ko: function() {
		return this.game_tree.actual_move.play && this.game_tree.actual_move.play.ko;
	},

	get_captured_count: function() {
		var play = this.game_tree.actual_move.play;
		if (play == undefined || play == null) {
			return {"B": 0, "W": 0};
		} else {
			return play.captured;
		}
	},

	// Takes a play and checks if it's suicide.
	// WARNING: use this after play_eat, otherwise you might be using an incomplete play, and fake truth might occur.
	play_check_suicide: function(play) {
		var res = false;
		if (play.remove.length == 0) {
			if (this.count_stone_liberties(play.put) == 0) {
				this.put_stone(play.put.color, play.put.row, play.put.col);
				var chain = this.get_distinct_chains([play.put])[0];
				if (this.chain_is_restricted(chain)) {
					res = true;
				}
				this.remove_stone(play.put.row, play.put.col);
			}
		}
		return res;
	},

	// Takes a play, appends it to the game_tree, updates the grid, the shower and changes next_move
	commit_play: function(play, node_source, wait) {
		this.game_tree.append(new GameNode(play, node_source), (node_source != NODE_VARIATION));
		this.make_play(play);
		if (this.shower) {
			this.shower.draw_play(play, wait);
			this.shower.update_captures(play);
			this.shower.update_move_number(this.game_tree.actual_move);
		}
	},

	// Next move method
	get_next_move: function() {
		var node = this.game_tree.actual_move;
		// XXX Danger, while true;
		while(true) {
			if (node.root) {
				if (node.next_move != undefined) {
					return node.next_move;
				} else {
					return "B";
				}
			}
			if (node.play instanceof FreePlay) {
				node = node.prev;
			} else {
				return (node.play.put.color == "W" ? "B" : "W");
			}
		}
	},


//	Game Seek
	prev: function(no_redraw) {
		if (this.is_attached()) {
			// TODO: what if we're playing offline?
			this.detach_head();
		}
		var node = this.game_tree.prev();
		if (node) {
			this.undo_play(node.play);
			if (!no_redraw) {
				if (this.shower) {
					this.shower.undraw_play(node.play);
					// Place last stone marker
					if (this.game_tree.actual_move.play instanceof Play) {
						this.shower.place_last_stone_marker(this.game_tree.actual_move.play.put);
					}
				}
			}

			node = this.game_tree.actual_move;
			if (node.play) {
				if (!no_redraw) {
					if (this.shower != undefined) {
						this.shower.refresh_ko(node.play);
						this.shower.update_captures(node.play);
					}
				}
			}
		}

		if (!no_redraw) {
			if (this.shower) {
				this.shower.clean_t_stones();
				this.shower.update_comments();
				this.shower.update_move_number(node);
			}
			this.render_tree();
		}
		return !!node;
	},

	next: function(index, no_redraw) {
		var node = this.game_tree.next(index);
		if (node) {
			this.make_play(node.play);
			if (!no_redraw) {
				if (this.shower) {
					this.shower.draw_play(node.play);
					this.shower.update_captures(node.play);
				}
			}
		}

		if (!no_redraw) {
			if (this.shower) {
				this.shower.clean_t_stones();
				this.shower.update_comments();
				this.shower.update_move_number(node);
			}
			this.render_tree();
		}

		return !!node;
	},

	up: function() {
		this.game_tree.up();

		this.render_tree();
	},

	down: function() {
		this.game_tree.down();

		this.render_tree();
	},

	fast_forward: function(count) {
		while(count > 0 && this.next(undefined, true)) {
			count--;
		}
		if (this.shower != undefined) {
			this.shower.redraw();
		}
		this.render_tree();
	},

	fast_backward: function(count) {
		while(count > 0 && this.prev(true)) {
			count--;
		}
		if (this.shower != undefined) {
			this.shower.redraw();
		}
		this.render_tree();
	},

	goto_start: function(no_redraw) {
		while (this.prev(true)) {
			continue;
		}
		if (!no_redraw) {
			if (this.shower != undefined) {
				this.shower.redraw();
			}
			this.render_tree();
		}
	},

	goto_end: function() {
		while (this.next(undefined, true)) {
			continue;
		}
		if (this.shower != undefined) {
			this.shower.redraw();
		}
		this.render_tree();
	},

	goto_path: function(path) {
		if (this.game_tree.test_path(path)) {
			this.goto_start(true);
			for (var i = 0, li = path.length; i < li; ++i) {
				this.next(path[i], true);
			}
			if (this.shower != undefined) {
				this.shower.redraw();
			}
			this.render_tree();
			return true;
		} else {
			return false;
		}
	},

	get_path: function() {
		if (this.game_tree != undefined && this.game_tree.actual_move != undefined) {
			return this.game_tree.actual_move.get_path();
		}
	},

//	Gameplay
	play: function(row, col, shift, ctrl) {
		// Observer ctrl-clicks
		if (ctrl && this.callbacks.coord_marker != undefined) {
			this.callbacks.coord_marker(row, col);
			return false;
		}

		// Check connection
		if (!this.connected) {
			return false;
		}

		var bRes = false;
		var tmp_play;
		switch(this.mode) {
			case "play":
				// Setup
				tmp_play = this.setup_play(row, col);

				if (tmp_play) {
					// Pause timer and get remain
					var time_left = false;
					if (this.timer != undefined) {
						time_left = this.timer.pause(true);
					}

					// Try to add time to play
					if (time_left !== false) {
						tmp_play.time_left = time_left[this.get_next_move()];
					}

					// Commit
					this.commit_play(tmp_play, NODE_OFFLINE);

					if (this.timer != undefined) {
						this.timer.resume(this.get_next_move());
						this.timer.tick();
					}

					bRes = true;
				}

			break;
			case "play_online":
				// Not my turn.
				if (!this.is_my_turn()) {
					return false;
				}

				// Setup
				tmp_play = this.setup_play(row, col);

				if (tmp_play) {
					// Time
					var tmp_remain = false;
					if (this.timer != undefined) {
						tmp_remain = this.timer.pause(true);
					}

					// Commit
					if (tmp_remain !== false) {
						tmp_play.time_left = tmp_remain[this.get_next_move()];
					}
					this.commit_play(tmp_play, NODE_ONLINE, true);
					if (this.sgf != undefined) {
						this.sgf.moves_loaded += this.data_to_sgf_node(tmp_play);
						// TODO: should add wait for server confirmation to this commit (even though the stone has been drawn)
					}
					if (KAYAGLOBAL != undefined) {
						KAYAGLOBAL.play_sound((this.get_next_move() == "W" ? "B" : "W"));
					}
					// TODO: turn count sucks monkey ass
					this.turn_count++;

					// Send Play Callback
					if (this.callbacks.send_play != undefined) {
						this.callbacks.send_play(this.data_to_sgf_node(tmp_play, tmp_remain));
					}

					bRes = true;
				}

			break;
			case "variation":
				tmp_play = this.setup_play(row, col);
				if (tmp_play) {
					this.commit_play(tmp_play, NODE_VARIATION);
					bRes = true;
				}
			break;
			case "free":

				// Cases in which a free play makes a new node in the tree.
				if (this.game_tree.actual_move == null) {
					// Make a new node in case there is no actual move
					this.game_tree.append(new GameNode(new FreePlay()), true)
				} else {
 					if (this.game_tree.actual_move.play instanceof FreePlay) {
						if (this.game_tree.actual_move.next.length > 0) {
							// Make a new node in case the actual move is free but there is a node next to it
							this.game_tree.append(new GameNode(new FreePlay()), true)
						}
					} else {
						// Make a new node in case the actual move is not free
						this.game_tree.append(new GameNode(new FreePlay()), true)
					}
				}

				var actual_play = this.game_tree.actual_move.play;
				if (actual_play.captured == undefined) {
					if (this.game_tree.actual_move.prev.play == null) {
						actual_play.captured = {"B": 0, "W": 0};
					} else {
						// Assumed that previous play always has the captured property defined, no matter if it's a Play or FreePlay instance.
						var previous_play_captured = this.game_tree.actual_move.prev.play.captured;
						actual_play.captured = {"B": previous_play_captured["B"], "W": previous_play_captured["W"],};
					}
				}

				var put = actual_play.get_put_by_pos(row, col);
				var rem = actual_play.get_rem_by_pos(row, col);

				switch(this.get_pos(row, col)) {
					case "W":
						// Tree
						if (!rem && !put) {
							actual_play.remove.push(new Stone("W", row, col));
							actual_play.put.push(new Stone("B", row, col));
						} else {
							actual_play.put.splice(put[0], 1);
							actual_play.put.push(new Stone("B", row, col));
						}
						// Grid
						this.remove_stone(row, col);
						this.put_stone("B", row, col);
						// Draw
						if (this.shower) {
							this.shower.remove_stone(row, col);
							this.shower.put_stone("B", row, col);
						}
					break;
					case "B":
						// Tree
						if (!rem && !put) {
							actual_play.remove.push(new Stone("B", row, col));
						} else {
							actual_play.put.splice(put[0], 1);
						}
						// Grid
						this.remove_stone(row, col);
						// Draw
						if (this.shower) {
							this.shower.remove_stone(row, col);
						}
					break;
					default:
						// Tree
						actual_play.put.push(new Stone("W", row, col));
						// Grid
						this.put_stone("W", row, col);
						// Draw
						if (this.shower) {
							this.shower.put_stone("W", row, col);
						}
					break;
				}

				bRes = true;

			break;
			case "count":
			case "count_online":
				if (this.mode == "count_online" && this.my_colour == "O") {
					return false;
				}
				var target = this.get_pos(row, col);
				if (target == undefined) {
					return false;
				}
				if (this.shower != undefined) {
					this.shower.clear_dead_groups(this.score.dead_groups);
				}
				var bChanged;
				if (shift) {
					bChanged = this.score.revive_stone(target, row, col);
				} else {
					bChanged = this.score.kill_stone(target, row, col);
				}
				this.draw_score();
				if (this.mode == "count_online") {
					if (bChanged) {
						this.send_score_state(row, col, shift);
					}
				}
			break;
		}

		if (bRes) {
			this.render_tree();
		}

		return bRes;
	},

	setup_play: function(row, col) {
		// Can't override a stone
		if (this.get_pos(row, col) != undefined) {
			return false;
		}
		// Can't place a stone on ko.
		if (this.pos_is_ko(row, col)) {
			return false;
		}

		// Place stone
		var tmp_play = new Play(this.get_next_move(), row, col);

		// Eat stones if surrounded
		this.play_eat(tmp_play);

		// Check suicide
		if (this.play_check_suicide(tmp_play)) {
			return false;
		}

		// Update play's ko.
		this.play_check_ko(tmp_play);

		// Update play's captures
		this.update_play_captures(tmp_play);

		return tmp_play;
	},

	update_play_captures: function(play) {
		// Set game captures when this play ocurs.
		var actual_move = this.game_tree.actual_move;
		if (actual_move.root != undefined && actual_move.root) {
			play.captured = {"B": 0, "W": 0};
		} else {
			var previous_play_captured = actual_move.play.captured;
			play.captured = {"B": previous_play_captured["B"], "W": previous_play_captured["W"],};
		}
		if (play.remove != undefined) {
			for (var s = 0, ls = play.remove.length; s < ls; ++s) {
				play.captured[play.remove[s].color]++;
			}
		}
	},

	is_my_turn: function() {
		return (this.my_colour == "A" || this.my_colour == this.get_next_move());
	},

	pass: function() {
		var bRes;
		switch(this.mode) {
			case "play":
				// Color
				var color = this.get_next_move();

				// Time
				var time_left = false;
				if (this.timer != undefined) {
					time_left = this.timer.pause(true);
				}

				// Play
				var tmp_play = new Pass(color);
				if (time_left !== false) {
					tmp_play.time_left = time_left[color];
				}
				this.update_play_captures(tmp_play);
				this.game_tree.append(new GameNode(tmp_play, NODE_OFFLINE), true);
				if (this.shower != undefined) {
					this.shower.clear_ko();
					this.shower.clear_last_stone_markers();
				}

				if (this.timer != undefined) {
					this.timer.resume(this.get_next_move());
					this.timer.tick();
				}

				bRes = true;

			break;
			case "play_online":
				// Not my turn.
				if (!this.is_my_turn()) {
					return false;
				}

				// Color
				var color = this.get_next_move();

				// Time
				var tmp_remain = false;
				if (this.timer != undefined) {
					tmp_remain = this.timer.pause(true);
				}

				// Play
				var tmp_play = new Pass(color)
				if (tmp_remain !== false) {
					tmp_play.time_left = tmp_remain[color]
				}
				this.update_play_captures(tmp_play);
				this.game_tree.append(new GameNode(tmp_play), NODE_ONLINE, true);
				if (this.shower != undefined) {
					this.shower.clear_ko();
					this.shower.clear_last_stone_markers();
				}

				if (this.sgf != undefined) {
					this.sgf.moves_loaded += this.data_to_sgf_node(tmp_play);
					// TODO: should add wait for server confirmation to this commit (even though the stone has been drawn)
				}
				if (KAYAGLOBAL != undefined) {
					KAYAGLOBAL.play_sound("pass");
				}
				// TODO: turn count sucks monkey ass
				this.turn_count++;

				// Send Play Callback
				if (this.callbacks.send_play != undefined) {
					this.callbacks.send_play(this.data_to_sgf_node(tmp_play, tmp_remain));
				}

				bRes = true;

			break;
		}

		return bRes;
	},

//	Auxiliar functions
	chain_is_restricted: function(chain) {
		for (var i = 0, li = chain.length; i < li; ++i) {
			if (this.count_stone_liberties(chain[i]) > 0) {
				return false;
			}
		}
		return true;
	},

	get_adjacent: function(color, row, col) {
		var res = [];
		for (i = row - 1 ; i <= row + 1 ; i++) {
			for (j = col - 1 ; j <= col + 1 ; j++) {
				if (this.safe_get_pos(i, j) == color) {
					res.push({color: color, row: i, col: j});
				}
			}
		}
		return res;
	},

	get_touched: function(color, row, col) {
		var res = [];
		if (this.safe_get_pos(row - 1, col) == color) {
			res.push({color: color, row: row - 1, col: col});
		}
		if (this.safe_get_pos(row, col - 1) == color) {
			res.push({color: color, row: row, col: col - 1});
		}
		if (this.safe_get_pos(row, col + 1) == color) {
			res.push({color: color, row: row, col: col + 1});
		}
		if (this.safe_get_pos(row + 1, col) == color) {
			res.push({color: color, row: row + 1, col: col});
		}
		return res;
	},

	count_stone_liberties: function(stone) {
		var count = 0;
		if (this.safe_get_pos(stone.row - 1, stone.col) == undefined) {
			count++;
		}
		if (this.safe_get_pos(stone.row, stone.col - 1) == undefined) {
			count++;
		}
		if (this.safe_get_pos(stone.row, stone.col + 1) == undefined) {
			count++;
		}
		if (this.safe_get_pos(stone.row + 1, stone.col) == undefined) {
			count++;
		}
		return count;
	},

	list_has_stone: function(list, stone) {
		for (var i = 0, li = list.length; i < li; ++i) {
			if (list[i].color == stone.color && list[i].row == stone.row && list[i].col == stone.col) {
				return true;
			}
		}
		return false;
	},

	get_distinct_chains: function(stones) {
		var res = [];
		var stone;
		var touched;
		var cur_chain;
		var chains_pend;
		var stone_touched = [];
		for (var i = 0, li = stones.length; i < li; ++i) {
			// Escape stones already added for being part of another chain.
			if (stone_touched[i] === true) {
				continue;
			}
			cur_chain = [];
			chains_pend = [];
			cur_chain.push(stones[i]);
			chains_pend.push(stones[i]);
			stone_touched[i] = true;
			while (chains_pend.length > 0) {
				stone = chains_pend.pop();
				touched = this.get_touched(stone.color, stone.row, stone.col);
				for (var j = 0, lj = touched.length; j < lj; ++j) {
					// Check that the stone has not been added before.
					if (this.list_has_stone(cur_chain, touched[j])) {
						continue;
					}
					// Check if i'm including one of the original stones.
					for (var k = i, lk = stones.length; k < lk; ++k) {
						if (stones[k].color == touched[j].color && stones[k].row == touched[j].row && stones[k].col == touched[j].col) {
							stone_touched[k] = true;
						}
					}
					cur_chain.push(touched[j]);
					chains_pend.push(touched[j]);
				}
			}
			res.push(cur_chain);
		}
		return res;
	},

	render_tree: function() {
		this.game_tree.render_tree();
	},

	get_next_track_id: function(force_id) {
		var id = 0;
		if (force_id == undefined) {
			while(this.tracks[id] != undefined) {
				id++;
			}
		} else {
			if (this.tracks[force_id] == undefined) {
				id = force_id;
			} else {
				throw new Error("Can't force track id. Already in use.");
			}
		}
		return id;
	},

	create_empty_track: function(force_id) {
		var id = this.get_next_track_id(force_id);
		var new_grid = Array(this.size);
		for (var i = 0, li = this.size; i < li; ++i) {
			new_grid[i] = Array(li);
		}
		this.tracks[id] = new Track(new_grid, this.game_tree.root);

		// Populate grid if root node has play.
		var prev_id = this.actual_track;
		var play = this.game_tree.root.play;
		if (play) {
			this.switch_to_track(id, true);
			this.make_play(play);
			this.switch_to_track(prev_id, true);
		}
		return id;
	},

	duplicate_actual_track: function(force_id) {
		var id = this.get_next_track_id(force_id);
		var new_grid = [];
		for (var i = 0, li = this.size; i < li; ++i) {
			new_grid.push(this.grid[i].slice());
		}
		this.tracks[id] = new Track(new_grid, this.game_tree.actual_move);
		return id;
	},

	load_track: function(variation, force_id) {
		// Validate variation format
		var rex = /^(\d\d?\d?)(\ )+([a-s]{2})+$/;
		if (!rex.test(variation)) {
			return false;
		}
		//var root_number = variation.match(/^0|^[1-9]\d*/)[0];
		var root_number = variation.match(/\d\d?\d?/)[0];

		// Save actual track id
		var old = this.actual_track;

		// Create empty track
		var id = this.create_empty_track(force_id);

		// Switch to new track
		this.switch_to_track(id, true);
			// Go to variation root
			var res;
			while(this.game_tree.actual_move.turn_number < root_number) {
				res = this.next(0, true);
				if (!res) {
					throw new Error("Todo mal, no llegué nunca al root number!");
					return false;
				}
			}

			variation = this.ungovar(variation, this.get_next_move());
			// Validate new variation format
			var rex = /^(0|([1-9]\d*))(\;(B|W)\[[a-s]{2}\])+$/;
			if (!rex.test(variation)) {
				return false;
			}
			var moves = variation.match(/;.*$/)[0];

			// Parse and load moves.
			var sgf = new SGFParser("(;FF[4]" + moves + ")");
			sgf.sgf_to_tree(this, sgf.root.last_next, this.game_tree.actual_move, NODE_VARIATION);

		// Switch to old track
		this.switch_to_track(old, true);
		return id;
	},

	switch_to_track: function(id, no_redraw) {
		if (!(this.tracks[id] instanceof Track)) {
			return false;
		}
		this.grid = this.tracks[id].grid;
		this.tracks[this.actual_track].head = this.game_tree.actual_move;
		this.game_tree.actual_move = this.tracks[id].head;
		this.actual_track = id;
		if (!no_redraw) {
			if (this.shower != undefined) {
				this.shower.redraw();
			}
			this.handle_score_agreement();
		}
		return true;
	},

	draw_variation_numbers: function() {
		var node = this.game_tree.actual_move;
		if (node.source == NODE_VARIATION) {
			while(node.prev && node.prev.source == NODE_VARIATION) {
				node = node.prev;
			}
			if (this.shower != undefined) {
				var num = 1;
				// XXX TODO FIXME: UGLY HARDCODED [0] -> i dont have last_next on variations...
				while(node.next[0]) {
					if (node.play) {
						this.shower.draw_number(node.play, num);
					}
					node = node.next[0];
					num++;
				}
				if (node.play) {
					this.shower.draw_number(node.play, num);
				}
			}
		}
	},

	var_to_string: function(tail) {
		var s_res = "";
		var tmp_node = this.game_tree.actual_move;
		if (tmp_node.source != NODE_VARIATION) {
			return "";
			throw new Error("No hay jugadas locales.");
		}
		while((tmp_node.source == NODE_VARIATION || !tail) && !tmp_node.root) {
			s_res = this.data_to_sgf_node(tmp_node.play) + s_res;
			tmp_node = tmp_node.prev;
		}
		if (!tail && tmp_node.root && tmp_node.play) {
			s_res = this.data_to_sgf_node(tmp_node.play) + s_res;
		} else {
			s_res = tmp_node.turn_number + s_res;
		}
		return s_res;
	},

	govar: function() {
		var s = this.var_to_string(true);
		if (s != "") {
			var i = s.indexOf(';');
			s = s.substring(0, i) + " " + s.substring(i, s.length).replace(/(;(W|B)\[|\])/g, "");
		}
		return s;
	},

	ungovar: function(govar, first_color) {
		var move = govar.match(/\d\d?\d?/)[0];
		var variation = govar.match(/([a-s][a-s])/g);
		var color = [];
		color[0] = first_color;
		color[1] = (first_color == "W" ? "B" : "W");
		var s = "";
		for (var i = 0, li = variation.length; i < li; ++i) {
			s += ";" + color[i % 2] + "[" + variation[i] + "]";
		}
		return move + s;
	},

//	Time commands
	setup_timer: function(time_settings) {
		switch(time_settings.name) {
			case "Absolute":
				this.timer = new AbsoluteTimer(this, time_settings.settings.main_time);
			break;
			case "Fischer":
				this.timer = new FischerTimer(this, time_settings.settings.main_time, time_settings.settings.bonus);
			break;
			case "Canadian":
				this.timer = new CanadianTimer(this, time_settings.settings.main_time, time_settings.settings.period_time, time_settings.settings.period_stones);
			break;
			case "Byoyomi":
				this.timer = new ByoyomiTimer(this, time_settings.settings.main_time, time_settings.settings.periods, time_settings.settings.period_time);
			break;
			case "Bronstein":
				this.timer = new BronsteinTimer(this, time_settings.settings.main_time, time_settings.settings.bonus);
			break;
			case "Hourglass":
				this.timer = new HourglassTimer(this, time_settings.settings);
			break;
		}
	},

	timer_settings_to_sgf: function(time_settings) {
		switch(time_settings.name) {
			case "Absolute":
				return "TM[" + time_settings.settings.main_time + "]";
			break;
			case "Fischer":
				return "OT[Fischer " + time_settings.settings.bonus + "]TM[" + time_settings.settings.main_time + "]";
			break;
			case "Canadian":
				return "UNSUPPORTED"; // TODO
				//this.timer = new CanadianTimer(this, time_settings.settings.main_time, time_settings.settings.period_time, time_settings.settings.period_stones);
			break;
			case "Byoyomi":
				return "OT[" + time_settings.settings.periods + "x" + time_settings.settings.period_time + " byo-yomi]TM[" + time_settings.settings.main_time + "]";
			break;
			case "Bronstein":
				return "UNSUPPORTED"; // TODO
				//this.timer = new BronsteinTimer(this, time_settings.settings.main_time, time_settings.settings.bonus);
			break;
			case "Hourglass":
				return "OT[Hourglass]TM[" + time_settings.settings.main_time + "]";
			break;
			default:
				return "";
			break;
		}
	},

	update_clocks: function(remain) {
		if (this.shower != undefined) {
			this.shower.update_clocks(remain);
		}
	},

	announce_time_loss: function(remain) {
		var i_lose = false;
		if (this.is_my_turn()) {
			switch(this.timer.system.name) {
				case "Absolute":
				case "Fischer":
					i_lose = (remain[this.get_next_move()] == 0);
				break;
				case "Hourglass":
					i_lose = (remain[this.get_next_move()].main_time == 0);
				break;
				case "Byoyomi":
					var my_remain = remain[this.get_next_move()];
					i_lose = (my_remain.main_time <= 0 && my_remain.periods <= 1 && my_remain.period_time <= 0);
				break;
			}
			if (i_lose) {
				var that = this;
				if (this.server_path_absolute_url != undefined && this.server_path_game_end != undefined) {
					$.post(this.server_path_absolute_url + this.server_path_game_end, {result: "time_loss"}, function(data, textStatus) {
						if (textStatus == "success") {
							if (KAYAGLOBAL != undefined) {
								KAYAGLOBAL.play_sound("outoftime");
							}
							that.timer.stop();
						}
					});
				}
			}
		}
		return i_lose;
	},

	resign: function() {
		if (this.server_path_absolute_url != undefined && this.server_path_game_end != undefined) {
			$.post(this.server_path_absolute_url + this.server_path_game_end, {result: "resign"});
		}
	},

//	Config commands
	change_mode: function(mode, no_redraw) {
		var modes = ["play", "play_online", "free", "variation", "count", "count_online",];
		if (typeof mode == "string") {
			if (!inArray(mode, modes)) {
				throw new Error("The 'mode' parameter must be in (" + modes + ").");
			}
		} else {
			throw new Error("The 'mode' parameter must be a string");
		}

		// If I was counting, clean score and set up everything to keep on playing.
		if ((this.mode == "count" || this.mode == "count_online") && mode != "count" && mode != "count_online") {
			this.quit_territory_counting();
			if (mode != "free" && this.timer != undefined) {
				this.timer.resume(this.get_next_move());
			}
		}

		if (mode == "free") {
			if (this.shower != undefined) {
				this.shower.clear_last_stone_markers();
			}
		}
		if (!no_redraw) {
			if (mode == "play" || mode == "play_online") {
				if (this.shower != undefined) {
					if (this.game_tree.actual_move.play instanceof Play) {
						this.shower.place_last_stone_marker(this.game_tree.actual_move.play.put);
					}
				}
			}
		}

		// If I'm going to count, do the first calculation and draw territory.
		if (this.mode != "count" && this.mode != "count_online" && (mode == "count" || mode == "count_online")) {
			this.mode = mode;
			this.start_territory_counting();
			if (this.timer != undefined) {
				this.timer.pause();
			}
		} else {
			this.mode = mode;
		}
	},

	// Clean score and set up everything to keep on playing.
	quit_territory_counting: function() {
		if (this.shower != undefined) {
			this.shower.clear_dead_groups(this.score.dead_groups);
			this.shower.clear_score();
		}
		this.score = undefined;
		if (this.shower != undefined) {
			if (this.game_tree.actual_move.play instanceof Play) {
				this.shower.place_last_stone_marker(this.game_tree.actual_move.play.put);
				this.shower.refresh_ko(this.game_tree.actual_move.play);
			}
			this.shower.update_score();
			this.shower.update_result();
		}
	},

	// Do the first calculation and draw territory.
	start_territory_counting: function() {
		this.score = new Score(this.ruleset, this.grid);
		var score = this.score.calculate_score();
		this.score.calculate_result(this.get_captured_count(), this.komi);
		if (this.shower != undefined) {
			this.shower.clear_last_stone_markers();
			this.shower.clear_ko();
			this.shower.draw_score(score);
			this.shower.update_score(this.score.score);
			this.shower.update_result(this.score.result);
		}
	},

	change_ruleset: function(ruleset) {
		var rules = ["Japanese", "Chinese",];
		if (typeof ruleset == "string") {
			if (!inArray(ruleset, rules)) {
				throw new Error("The ruleset parameter must be in (" + rules + ").");
			}
		} else {
			throw new Error("The ruleset parameter must be a string");
		}
		this.ruleset = ruleset;
	},

	change_my_colour: function(colour) {
		var colours = ["B", "W", "A", "O",];
		if (typeof colour == "string") {
			if (!inArray(colour, colours)) {
				throw new Error("The 'colour' parameter must be in (" + colours + ").");
			}
		} else {
			throw new Error("The 'colour' parameter must be a string");
		}
		this.my_colour = colour;
	},

	change_size: function(size) {
		var sizes = [19, 13, 9,];
		if (typeof size == "number") {
			if (!inArray(size, sizes)) {
				throw new Error("The 'size' parameter must be in (" + sizes + ").");
			}
		} else {
			throw new Error("The 'size' parameter must be a number");
		}
		if (this.size != size) {
			this.size = size;
			this.clear();
			this.render();
			this.render_tree();
		}
	},

	change_komi: function(komi) {
		if (typeof komi != "number") {
			throw new Error("The 'komi' parameter must be a number");
		}
		this.komi = komi;
	},

	clear: function() {
		// Grid
		this.grid = Array(this.size);
		for (var row = 0 ; row < this.size ; row++) {
			this.grid[row] = Array(this.size);
		}

		// Timer
		this.timer = undefined;

		// SGFParser
		if (this.sgf != undefined) {
			this.sgf.init(this.sgf.sgf);
		}

		// GameTree
		this.game_tree = new GameTree(this.div_id_tree);

		// Tracks
		this.tracks = [];
		this.tracks[0] = new Track(this.grid, this.game_tree.actual_move);
		this.actual_track = 0;

		// Game
		// TODO: turn count sucks monkey ass
		this.turn_count = 0;

		// Clear shower
		if (this.shower != undefined) {
			this.shower.clear();
		}
	},

	render: function() {
		if (this.shower) {
			this.shower.render();
		}
	},

//	Game Over
	territory_count: function() {
		return;
	},

// Online helpers
	connect: function() {
		this.connected = true;
		/*
		// TODO: guess what is the best thing to do with timer when jugs disconnect.
		if (this.timer != undefined) {
			this.timer.resume(this.get_next_move());
		}
		*/
	},

	disconnect: function() {
		/*
		// TODO: guess what is the best thing to do with timer when jugs disconnect.
		if (this.timer != undefined) {
			this.timer.pause();
		}
		*/
		this.connected = false;
	},

	string_to_play: function(data) {
		var row_patt = /^[A-Z]/;
		var row = row_patt.exec(data)[0];
		row = row.charCodeAt(0) - 65;
		var col_patt = /[0-9]*$/;
		var col = parseInt(col_patt.exec(data)[0], 10);
		return {row: row, col: col};
	},

	pos_to_sgf_coord: function(row, col) {
		return String.fromCharCode(97 + col) + String.fromCharCode(97 + row);
	},

	sgf_coord_to_pos: function(coord) {
		return {row: coord.charCodeAt(1) - 97, col: coord.charCodeAt(0) - 97};
	},

	data_to_sgf_node: function(play, remain) {
		var res = ";";

		// Move property
		if (play instanceof Play) {
			res += play.put.color + "[" + this.pos_to_sgf_coord(play.put.row, play.put.col) + "]";
		} else if (play instanceof Pass) {
			res += play.put.color + "[]";
		} else if (play instanceof FreePlay) {
			if (play.remove.length > 0) {
				res += "AE";
				for (var e = 0, le = play.remove.length; e < le; ++e) {
					res += "[" + this.pos_to_sgf_coord(play.remove[e].row, play.remove[e].col) + "]";
				}
			}
			if (play.put.length > 0) {
				var s_tmp = [];
				s_tmp["B"] = "AB";
				s_tmp["W"] = "AW";
				for (var e = 0, le = play.put.length; e < le; ++e) {
					s_tmp[play.put[e].color] += "[" + this.pos_to_sgf_coord(play.put[e].row, play.put[e].col) + "]";
				}
				if (s_tmp["B"].length > 2) {
					res += s_tmp["B"];
				}
				if (s_tmp["W"].length > 2) {
					res += s_tmp["W"];
				}
			}
		}

		// Time left property
		if (remain != undefined && remain !== false) {
			switch(this.timer.system.name) {
				case "Absolute":
				case "Fischer":
					res += play.put.color + "L[" + Number(remain[play.put.color]).toFixed(3) + "]";
				break;
				case "Hourglass":
					res += play.put.color + "L[" + Number(remain[play.put.color].main_time).toFixed(3) + "]";
				break;
				case "Byoyomi":
					if (remain[play.put.color].main_time > 0) {
						res += play.put.color + "L[" + Number(remain[play.put.color].main_time).toFixed(3) + "]";
					} else {
						res += play.put.color + "L[" + Number(remain[play.put.color].period_time).toFixed(3) + "]O" + play.put.color + "[" + remain[play.put.color].periods + "]";
					}
				break;
			}
		}

		return res;
	},

	send_score_state: function(row, col, alive) {
		if (this.server_path_absolute_url != undefined && this.server_path_game_move != undefined) {
			$.post(this.server_path_absolute_url + this.server_path_game_move, {score_state: ";" + (alive ? 'A' : 'D') + "[" + this.pos_to_sgf_coord(row, col) + "]"});
		}
	},

	confirm_play: function() {
		if (this.shower != undefined) {
			var play = this.game_tree.actual_move.play;
			if (play instanceof Play) {
				this.shower.confirm_play(play.put);
			}
		}
	},

	diff_update_game: function(data) {
		// Check SGF status:
		if (this.sgf == undefined || this.sgf == null || this.sgf.status != SGFPARSER_ST_LOADED) {
			// Not loaded: load from scratch.
			this.update_game(data);
		} else {
			// Loaded: diff update.
			if (this.timer != undefined) {
				if (data.result != undefined) {
					this.timer.stop();
				} else {
					this.timer.pause();
				}
			}

			// Clear and change size if required
			if (data.size != undefined && data.size != this.size) {
				this.change_size(Number(data.size));
			}

			// Compare SGF and add only new moves + update score state if not attached.
			var move_added = false;
			if (data.moves != undefined && data.moves != null) {
				if (!this.is_attached()) {
					this.attach_head(true);
					move_added = this.sgf.add_moves(this, data.moves, true);
					// XXX metodo cabeza para soportar UNDO.
					if (move_added) {
						this.update_raw_score_state(data.raw_score_state);
						this.update_timer(data.time_adjustment);
						this.detach_head(true);
					} else {
						return this.update_game(data);
					}
				} else {
					move_added = this.sgf.add_moves(this, data.moves);
					// XXX metodo cabeza para soportar UNDO.
					if (!move_added) {
						return this.update_game(data);
					}
				}
			}

			// Play sound!
			if (KAYAGLOBAL != undefined) {
				if (move_added.play instanceof Play) {
					KAYAGLOBAL.play_sound(move_added.play.put.color);
				} else if (move_added.play instanceof Pass) {
					KAYAGLOBAL.play_sound("pass");
				}
			}

			if (this.is_attached()) {
				// Fast forward
				this.goto_end();
				this.handle_score_agreement(data.raw_score_state);
				this.update_timer(data.time_adjustment);
			}
		}
	},

	update_timer: function(time_adjustment) {
		if (this.mode == "count" || this.mode == "count_online") {
			return false;
		}
		if (this.timer != undefined) {
			var play;
			var color;
			var end = false;
			var last_remain_black;
			var last_remain_white;
			var node = this.game_tree.actual_move;

			// Fetch last remain for black and white.
			while(!end) {
				play = node.play;
				if (play instanceof Play || play instanceof Pass) {
					color = play.put.color;
					if (color == "B" && last_remain_black == undefined) {
						last_remain_black = play.time_left;
					}
					if (color == "W" && last_remain_white == undefined) {
						last_remain_white = play.time_left;
					}
				}
				if (last_remain_white != undefined && last_remain_black != undefined) {
					end = true;
				} else {
					node = node.prev;
					if (node == undefined) {
						end = true;
					}
				}
			}

			// Configure default time depending on time system.
			switch(this.timer.system.name) {
				case "Absolute":
				case "Fischer":
					if (last_remain_white == undefined) {
						last_remain_white = Number(this.timer.system.time);
					}
					if (last_remain_black == undefined) {
						last_remain_black = Number(this.timer.system.time);
					}
				break;
				case "Hourglass":
					var color = this.get_next_move();

					if (last_remain_black == undefined && last_remain_white == undefined) {
						last_remain_black = {
							main_time: Number(this.timer.system.main_time),
						};
						last_remain_white = {
							main_time: Number(this.timer.system.main_time),
						};
					} else if (last_remain_black == undefined) {
						last_remain_black = {
							main_time: parseFloat(this.timer.system.main_time) + (parseFloat(this.timer.system.main_time) - Number(last_remain_white.main_time)),
						};
					} else if (last_remain_white == undefined) {
						last_remain_white = {
							main_time: parseFloat(this.timer.system.main_time) + (parseFloat(this.timer.system.main_time) - Number(last_remain_black.main_time)),
						};
					} else {
						if (color == "B") {
							last_remain_black = {
								main_time: parseFloat(this.timer.system.main_time) + (parseFloat(this.timer.system.main_time) - Number(last_remain_white.main_time)),
							};
						} else {
							last_remain_white = {
								main_time: parseFloat(this.timer.system.main_time) + (parseFloat(this.timer.system.main_time) - Number(last_remain_black.main_time)),
							};
						}
					}
				break;
				case "Byoyomi":
					if (last_remain_white == undefined) {
						last_remain_white = {
							'main_time': this.timer.system.main_time,
							'period_time': this.timer.system.period_time,
							'periods': this.timer.system.periods,
						};
					}
					if (last_remain_black == undefined) {
						last_remain_black = {
							'main_time': this.timer.system.main_time,
							'period_time': this.timer.system.period_time,
							'periods': this.timer.system.periods,
						};
					}
				break;
			}

			// Finally setup clocks.
			if (this.timer.system.name == "Hourglass") {
				// The new way...
				var rmn = {};
				rmn["B"] = last_remain_black;
				rmn["W"] = last_remain_white;
				this.timer.set_remain(rmn);
			} else {
				this.timer.set_remain("B", last_remain_black);
				this.timer.set_remain("W", last_remain_white);
			}

			this.timer.resume(this.get_next_move());
			if (time_adjustment != undefined) {
				this.timer.adjust(time_adjustment);
			}
		}

	},

	update_game: function(data) {
		this.clear();

		var sSgf = this.juggernaut_data_to_sgf(data);

		// Load sgf
		if (this.sgf != undefined) {
			this.sgf.init(sSgf);
		} else {
			this.sgf = new SGFParser(sSgf);
		}
		this.sgf.load(this);
		if (this.sgf.status == SGFPARSER_ST_ERROR) {
			throw new Error("Could not load SGF.\n" + this.sgf.error + "\n" + sSgf);
		}
		this.goto_end();
		this.handle_score_agreement(data.raw_score_state);
		this.update_timer(data.time_adjustment);

		// Stop timer when game ends
		if (this.timer != undefined) {
			if (data.result != undefined) {
				this.timer.stop();
			}
		}
	},

	juggernaut_data_to_sgf: function(data) {
		var sSgf = "(;FF[4]";
		// Size
		if (data.size) {
			sSgf += "SZ[" + data.size + "]";
		}
		// Timer config
		if (data.time_settings != undefined) {
			sSgf += this.timer_settings_to_sgf(data.time_settings);
		}
		// Handicap
		if (data.handicap_sgf_node != undefined) {
			sSgf += data.handicap_sgf_node;
		}
		// Moves
		if (data.moves) {
			sSgf += data.moves;
		}
		sSgf += ")";

		return sSgf;
	},

	place_coord_marker: function(row, col) {
		if (this.shower != undefined) {
			if (this.safe_get_pos(row, col) != "") {
				this.shower.place_coord_marker(row, col);
			}
		}
	},

	clear_coord_marker: function() {
		if (this.shower != undefined) {
			this.shower.clear_coord_marker();
		}
	},

	handle_score_agreement: function(raw_score_state) {
		if (this.mode == "count_online" || this.mode == "count") {
			this.update_raw_score_state(raw_score_state);
			this.refresh_score();
		} else {
			if (this.check_score_agreement()) {
				if (this.mode == "play_online") {
					this.change_mode("count_online");
				} else if (this.mode == "play") {
					this.change_mode("count");
				}
				if (raw_score_state) {
					this.update_raw_score_state(raw_score_state);
				}
				this.refresh_score();
			}
		}
	},

	check_score_agreement: function() {
		if (this.mode == "count_online" || this.mode == "count" || this.mode == "variation") {
			return false;
		} else {
			var prev = this.game_tree.actual_move.prev;
			var play = this.game_tree.actual_move.play;
			if (prev != undefined && prev.play instanceof Pass && play instanceof Pass) {
				return true;
			} else {
				return false;
			}
		}
	},

	update_raw_score_state: function(score_state) {
		var play = this.game_tree.actual_move.play;
		if (play instanceof Pass) {
			play.raw_score_state = score_state;
			return true;
		} else {
			return false;
		}
	},

	refresh_score: function() {
		if (this.mode != "count_online" && this.mode != "count") {
			return false;
		}
		if (this.shower != undefined) {
			this.shower.clear_dead_groups(this.score.dead_groups); // XXX FIXME TODO: maybe this should be independent from this.score... maybe a full clean.
		}
		var states = this.game_tree.actual_move.play.raw_score_state;
		if (states != undefined) {
			states = states.match(/;(A|D)\[[a-s]{2}\]/g);
			for (var i = 0, li = states.length; i < li; ++i) {
				var alive = (states[i].charAt(1) == "A");
				var pos = this.sgf_coord_to_pos(states[i].match(/[a-s]{2}/)[0]);
				var target = this.get_pos(pos.row, pos.col);
				if (target == undefined) {
					continue;
				}
				if (alive) {
					this.score.revive_stone(target, pos.row, pos.col);
				} else {
					this.score.kill_stone(target, pos.row, pos.col);
				}
			}
		}
		this.draw_score();
	},

	draw_score: function() {
		var score = this.score.calculate_score();
		this.score.calculate_result(this.get_captured_count(), this.komi);
		if (this.shower != undefined) {
			this.shower.draw_dead_groups(this.score.dead_groups);
			this.shower.clear_score();
			this.shower.draw_score(score);
			this.shower.update_score(this.score.score);
			this.shower.update_result(this.score.result);
		}
	},

	is_attached: function() {
		return (this.mode == "play_online" || this.mode == "count_online") && this.actual_track == TRACK_ONLINE;
	},

	detach_head: function(no_redraw) {
		// Only detach if is not detached.
		if (this.actual_track == TRACK_ONLINE) {
			// If there is no local grid, create it copying the global.
			if (this.tracks[TRACK_OFFLINE] == undefined) {
				this.duplicate_actual_track(TRACK_OFFLINE);
			}
			// Switch track and mode
			this.change_mode("variation", no_redraw);
			this.switch_to_track(TRACK_OFFLINE, no_redraw);
		}
	},

	attach_head: function(no_redraw) {
		// Only attach if is not already attached.
		if (this.actual_track != TRACK_ONLINE) {
			// Switch track and mode
			this.change_mode("play_online", no_redraw);
			this.switch_to_track(TRACK_ONLINE, no_redraw);
		}
	},
}

// ~ <3
