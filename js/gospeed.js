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
		if (args.time_config != undefined) {
			if (args.time_config.div_id_clock_w != undefined) {
				this.div_id_clock_w = args.time_config.div_id_clock_w;
			}
			if (args.time_config.div_id_clock_b != undefined) {
				this.div_id_clock_b = args.time_config.div_id_clock_b;
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

	// Shower
		// Define the showing engine
		if (args.shower != undefined) {
			if (args.shower == "basic") {
				this.shower = new GoShower(this);
			} else if (args.shower == "graphic") {
				this.shower = new GoGraphic(this);
			}
		}

	// Timer
		if (args.time_config != undefined) {
			this.setup_timer(args.time_config.time_system, {"main_time": args.time_config.starting_time});
		}

	// GameTree
		this.game_tree = new GameTree();
		if (args.div_id_tree != undefined) {
			this.tree_div = document.getElementById(args.div_id_tree);
		}

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
		this.tracks[0] = new Track(this.grid, this.game_tree.actual_move);
		this.actual_track = 0;

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
			for (var stone in play.remove) {
				this.remove_stone(play.remove[stone].row, play.remove[stone].col);
			}
			for (var stone in play.put) {
				this.put_stone(play.put[stone].color, play.put[stone].row, play.put[stone].col);
			}
		} else if (play instanceof Play) {
			this.put_stone(play.put.color, play.put.row, play.put.col);
			for (var stone in play.remove) {
				this.remove_stone(play.remove[stone].row, play.remove[stone].col);
			}
		}
	},

	// Takes a play and undoes it's content to the grid (updates gospeed.ko)
	undo_play: function(play) {
		if (play instanceof FreePlay) {
			for (var stone in play.put) {
				this.remove_stone(play.put[stone].row, play.put[stone].col);
			}
			for (var stone in play.remove) {
				this.put_stone(play.remove[stone].color, play.remove[stone].row, play.remove[stone].col);
			}
		} else if (play instanceof Play) {
			this.remove_stone(play.put.row, play.put.col);
			for (var stone in play.remove) {
				this.put_stone(play.remove[stone].color, play.remove[stone].row, play.remove[stone].col);
			}
		}
	},

	// Takes a play and completes it's 'remove' property with the stones that would eat from the board.
	play_eat: function(play) {
		this.put_stone(play.put.color, play.put.row, play.put.col);

		var target_color = (play.put.color == "W" ? "B" : "W");
		var adj = this.get_touched(target_color, play.put.row, play.put.col);
		var chains = this.get_distinct_chains(adj);

		for (var chain in chains) {
			if (this.chain_is_restricted(chains[chain])) {
				for (var stone in chains[chain]) {
					play.remove.push(new Stone(target_color, chains[chain][stone].row, chains[chain][stone].col));
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
		this.game_tree.append(new GameNode(play, node_source));
		this.make_play(play);
		if (this.shower) {
			this.shower.draw_play(play, wait);
			this.shower.update_captures(play);
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
	prev: function() {
		if (this.is_attached()) {
			// TODO: what if we're playing offline?
			this.detach_head();
		}
		var play = this.game_tree.prev();
		if (play) {
			this.undo_play(play);
			if (this.shower) {
				this.shower.undraw_play(play);
				// Place last stone marker
				if (this.game_tree.actual_move.play instanceof Play) {
					this.shower.place_last_stone_marker(this.game_tree.actual_move.play.put);
				}
			}
		} else {
			return false;
		}

		play = this.game_tree.actual_move.play;
		if (play) {
			if (this.shower != undefined) {
				this.shower.refresh_ko(play);
				this.shower.update_captures(play);
			}
		} else {
			return false;
		}

		if (this.shower) {
			this.shower.clean_t_stones();
		}

		this.render_tree();
		return true;
	},

	next: function(index, no_redraw) {
		var play = this.game_tree.next(index);
		if (play) {
			this.make_play(play);
			if (!no_redraw) {
				if (this.shower) {
					this.shower.draw_play(play);
					this.shower.update_captures(play);
				}
			}
		} else {
			return false;
		}

		if (!no_redraw) {
			if (this.shower) {
				this.shower.clean_t_stones();
			}
			this.render_tree();
		}
		return true;
	},

	up: function() {
		this.game_tree.up();

		this.render_tree();
	},

	down: function() {
		this.game_tree.down();

		this.render_tree();
	},

	goto_start: function() {
		while (this.prev()) {
			continue;
		}
	},

	goto_end: function() {
		while (this.next()) {
			continue;
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
					// Timer
					var time_left;
					if (this.timer != undefined) {
						time_left = this.timer.pause()[this.get_next_move()];
					}

					// Commit
					tmp_play.time_left = time_left;
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
					var tmp_remain;
					var time_left;
					if (this.timer != undefined) {
						tmp_remain = this.timer.pause();
						time_left = tmp_remain[this.get_next_move()];
					}

					// Commit
					tmp_play.time_left = time_left;
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
					this.send_play(tmp_play, tmp_remain);
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
					this.game_tree.append(new GameNode(new FreePlay()))
				} else {
 					if (this.game_tree.actual_move.play instanceof FreePlay) {
						if (this.game_tree.actual_move.next.length > 0) {
							// Make a new node in case the actual move is free but there is a node next to it
							this.game_tree.append(new GameNode(new FreePlay()))
						}
					} else {
						// Make a new node in case the actual move is not free
						this.game_tree.append(new GameNode(new FreePlay()))
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
		for (var stone in play.remove) {
			play.captured[play.remove[stone].color]++;
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
				var time_left;
				if (this.timer != undefined) {
					time_left = this.timer.pause()[color]
				}

				// Play
				var tmp_play = new Pass(color);
				tmp_play.time_left = time_left;
				this.update_play_captures(tmp_play);
				this.game_tree.append(new GameNode(tmp_play, NODE_OFFLINE));
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
				var tmp_remain;
				var time_left;
				if (this.timer != undefined) {
					tmp_remain = this.timer.pause();
					time_left = tmp_remain[color]
				}

				// Play
				var tmp_play = new Pass(color)
				tmp_play.time_left = time_left;
				this.update_play_captures(tmp_play);
				this.game_tree.append(new GameNode(tmp_play), NODE_ONLINE);
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
				this.send_play(tmp_play, tmp_remain);
				bRes = true;

			break;
		}

		return bRes;
	},

//	Auxiliar functions
	chain_is_restricted: function(chain) {
		for (var stone in chain) {
			if (this.count_stone_liberties(chain[stone]) > 0) {
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
		for (var item in list) {
			if (list[item].color == stone.color && list[item].row == stone.row && list[item].col == stone.col) {
				return true;
			}
		}
		return false;
	},

	get_distinct_chains: function(stones) {
		var chains = [];
		var chains_pend = [];
		var stone;
		var touched;
		for (stone in stones) {
			chains.push([stones[stone]]);
			chains_pend.push([stones[stone]]);
		}

		granloop:
		for (var chain in chains_pend) {
			while (chains_pend[chain].length > 0) {
				touched = [];
				stone = chains_pend[chain].pop();
				touched = this.get_touched(stone.color, stone.row, stone.col);
				for (stone in touched) {
					if (this.list_has_stone(chains[chain], touched[stone])) {
						continue;
					} else {
						for (var ch in chains) {
							if (this.list_has_stone(chains[ch], touched[stone])) {
								delete chains[chain];
								delete chains_pend[chain];
								continue granloop;
							}
						}
						chains[chain].push(touched[stone]);
						chains_pend[chain].push(touched[stone]);
					}
				}
			}
		}

		return chains;
	},

	render_tree: function() {
		if (this.tree_div) {
			this.tree_div.innerHTML = this.game_tree.toString();
		}
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
	setup_timer: function(time_system, time_settings) {
		switch(time_system) {
			case "Absolute":
				this.timer = new AbsoluteTimer(this, time_settings.main_time);
				//this.update_clocks(this.timer.remain);
			break;
		}
	},

	update_clocks: function(remain) {
		if (this.shower != undefined) {
			this.shower.update_clocks(remain);
		}
	},

	announce_time_loss: function(remain) {
		if (remain[this.my_colour] == 0) {
			if (this.server_path_absolute_url != undefined && this.server_path_game_end != undefined) {
				$.post(this.server_path_absolute_url + this.server_path_game_end, {result: "time_loss"});
			}
		}
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
		this.game_tree = new GameTree();

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
				for (var e in play.remove) {
					res += "[" + this.pos_to_sgf_coord(play.remove[e].row, play.remove[e].col) + "]";
				}
			}
			if (play.put.length > 0) {
				var s_tmp = [];
				s_tmp["B"] = "AB";
				s_tmp["W"] = "AW";
				for (var e in play.put) {
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
		if (remain) {
			res += play.put.color + "L[" + Number(remain[play.put.color]).toFixed(3) + "]";
		}

		return res;
	},

	send_play: function(play, remain) {
		if (this.server_path_absolute_url != undefined && this.server_path_game_move != undefined) {
			$.post(this.server_path_absolute_url + this.server_path_game_move, {move: this.data_to_sgf_node(play, remain)});
		}
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

	update_my_colour: function(white_player, black_player) {
		if (this.my_nick != undefined) {
			if (black_player == this.my_nick && white_player == this.my_nick) {
				this.change_my_colour("A");
			} else if (black_player == this.my_nick) {
				this.change_my_colour("B");
			} else if (white_player == this.my_nick) {
				this.change_my_colour("W");
			} else {
				this.change_my_colour("O");
			}
		} else {
			this.change_my_colour("O");
		}
	},

	diff_update_game: function(data) {
		// Stop timer when game ends
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

		// Check SGF status and load sgf if necesary
		if (this.sgf == undefined || this.sgf == null || this.sgf.status != SGFPARSER_ST_LOADED) {
			this.update_game(data);
			return false;
		}

		// Change my colour if player has changed
		this.update_my_colour(data.white_player, data.black_player);

		// Compare SGF and add only new moves + update score state if not attached.
		var move_added = false;
		if (data.moves != undefined && data.moves != null) {
			if (!this.is_attached()) {
				this.attach_head(true);
				move_added = this.sgf.add_moves(this, data.moves, true);
				this.update_raw_score_state(data.raw_score_state);
				this.update_timer(data.time_adjustment);
				this.detach_head(true);
			} else {
				move_added = this.sgf.add_moves(this, data.moves);
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

		// Quit playing when game ends
		if (data.result != undefined) {
			this.mode = "finished";
		}
	},

	update_timer: function(time_adjustment) {
		if (this.mode == "count" || this.mode == "count_online" || this.mode == "finished") {
			return false;
		}
		if (this.timer != undefined) {
			var play;
			var color;
			var end = false;
			var last_remain_black;
			var last_remain_white;
			var node = this.game_tree.actual_move;
			switch(this.timer.system.name) {
				case "Absolute":
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
					if (last_remain_white == undefined) {
						last_remain_white = this.timer.system.time;
					}
					if (last_remain_black == undefined) {
						last_remain_black = this.timer.system.time;
					}
					this.timer.set_remain("B", Number(last_remain_black));
					this.timer.set_remain("W", Number(last_remain_white));
				break;
			}
			this.timer.resume(this.get_next_move());
			if (time_adjustment != undefined) {
				this.timer.adjust(time_adjustment);
			}
		}

	},

	update_game: function(data) {
		this.clear();

		// Change my colour if player has changed
		this.update_my_colour(data.white_player, data.black_player);


		// Recreate sgf from info
			var sSgf = "(;FF[4]";

			// Size
			if (data.size) {
				sSgf += "SZ[" + data.size + "]";
			}
			// Timer config
			if (data.time_settings != undefined) {
				this.setup_timer(data.time_settings.name, data.time_settings.settings);
			}
			// Moves
			if (data.moves) {
				sSgf += data.moves;
			}
			sSgf += ")";

		// Load sgf
		if (this.sgf != undefined) {
			this.sgf.init(sSgf);
		} else {
			this.sgf = new SGFParser(sSgf);
		}
		this.sgf.load(this);
		this.render();
		this.goto_end();
		this.handle_score_agreement(data.raw_score_state);
		this.update_timer(data.time_adjustment);
	},

	place_coord_marker: function(row, col) {
		if (this.shower != undefined) {
			this.shower.place_coord_marker(row, col);
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
			for (var id in states) {
				var alive = (states[id].charAt(1) == "A");
				var pos = this.sgf_coord_to_pos(states[id].match(/[a-s]{2}/)[0]);
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

