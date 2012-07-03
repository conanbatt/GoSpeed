var TRACK_ONLINE = 0;
var TRACK_OFFLINE = 1;
var TRACK_VARIATION = 2;
var ST_LOADING = 0;
var ST_WAITING = 1;
var ST_READY = 2;

function GoSpeed(args) {
	this.init.apply(this, [args]);
}

GoSpeed.prototype = {
	init: function() {
		this.status = ST_LOADING;

	// Validation
		var validator = new GoValidate(arguments);
		this.args = validator.args;

	// Board
		this.board = new GoBan(this, this.args);

	// Setup
		this.mode = this.args.mode;
		this.ruleset = this.args.ruleset;
		this.komi = this.args.komi;

	// Timer
		this.time = new GoTime(this, this.args.time_settings);

	// GameTree
		var that = this;
		this.game_tree = new GameTree(this.args.div_id_tree, function(path) {
			if (that.callbacks.send_focus != undefined) {
				that.callbacks.send_focus(path);
			} else {
				that.goto_path.call(that, path);
			}
		});

	// Online
		if (this.args.my_colour != undefined) {
			this.my_colour = this.args.my_colour;
		}
		if (this.args.my_nick != undefined) {
			this.my_nick = this.args.my_nick;
		}
		this.connected = (this.mode != "play_online" && this.mode != "count_online");

	// Tracks
		this.tracks = [];
		this.tracks[TRACK_ONLINE] = new Track(this.board.grid, this.game_tree.actual_move);
		this.actual_track = TRACK_ONLINE;

	// Game
		// TODO: turn count sucks monkey ass
		this.turn_count = 0;

	// Callbacks
		this.callbacks = this.args.callbacks || {};

	// Paths
		if (this.args.server_path_gospeed_root != undefined) {
			this.server_path_gospeed_root = this.args.server_path_gospeed_root;
		}
		if (this.args.server_path_absolute_url != undefined) {
			this.server_path_absolute_url = this.args.server_path_absolute_url;
		}
		if (this.args.server_path_game_move != undefined) {
			this.server_path_game_move = this.args.server_path_game_move;
		}
		if (this.args.server_path_game_end != undefined) {
			this.server_path_game_end = this.args.server_path_game_end;
		}

	// Shower
		// Define the showing engine
		if (this.args.shower != undefined) {
			if (this.args.shower == "basic") {
				this.shower = new GoShower(this, this.args);
			} else if (this.args.shower == "graphic") {
				this.shower = new GoGraphic(this, this.args);
			}
		}

	// Render
		this.render(true);

		this.status = ST_READY;
	},

//	Game Seek
	prev: function(no_redraw) {
		// XXX: commented this, don't know what is doing here, certainly related with Kaya.
		// XXX: this doesn't look like the right place for it.
		/*
		if (this.is_attached()) {
			// TODO: what if we're playing offline?
			this.detach_head();
		}
		*/
		var node = this.game_tree.prev();
		if (node) {
			this.board.undo_play(node.play);
			if (!no_redraw) {
				if (this.shower) {
					this.shower.clear_ko();
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
			this.board.make_play(node.play);
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

	goto_path: function(path, no_redraw) {
		// Basic format check
		if (!/^((\d+|\d+-\d+)+(\|(\d+|\d+-\d+))*|(\d+|\d+-\d+)|(root))$/.test(path)) {
			return false;
		}
		// Parse path to array
		var arr_path = path.split("|");
		for (var i = 0, li = arr_path.length; i < li; ++i) {
			arr_path[i] = arr_path[i].split("-");
		}
		// Test array path
		if (this.game_tree.test_path(arr_path)) {
			// Mode adjustments
			if (this.mode == "count_online") {
				this.change_mode("play_online");
			}
			if (this.mode == "count") {
				this.change_mode("play");
			}

			var pos; // Decition to make
			var count; // Number of times
			// Go to root and then browse path
			this.goto_start(true);
			if (path != "root") {
				for (var i = 0, li = arr_path.length; i < li; ++i) {
					pos = Number(arr_path[i][0]);
					if (arr_path[i][1] !== undefined) {
						count = Number(arr_path[i][1]);
					} else {
						count = 1;
					}
					while(count--) {
						this.next(pos, true);
					}
				}
			}
			// Render after all (unless no_redraw)
			if (!no_redraw) {
				if (this.shower != undefined) {
					this.shower.redraw();
				}
				this.render_tree();
			}
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
		if (!this.connected || this.status != ST_READY) {
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
					var time_left = this.time.pause(true);

					// Try to add time to play
					if (time_left !== false) {
						tmp_play.time_left = time_left[this.get_next_move()];
					}

					// Commit
					this.commit_play(tmp_play, NODE_OFFLINE);

					this.time.resume(this.get_next_move());

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
					var tmp_remain = this.time.pause(true);

					// Commit
					if (tmp_remain !== false) {
						tmp_play.time_left = tmp_remain[this.get_next_move()];
					}
					this.commit_play(tmp_play, NODE_ONLINE, true);
					if (this.sgf != undefined) {
						this.sgf.moves_loaded += this.data_to_sgf_node(tmp_play);
						// TODO: should add wait for server confirmation to this commit (even though the stone has been drawn)
					}
					if (typeof KAYAGLOBAL != "undefined") {
						KAYAGLOBAL.play_sound((this.get_next_move() == "W" ? "B" : "W"));
					}
					// TODO: turn count sucks monkey ass
					this.turn_count++;

					// Send Play Callback
					if (this.callbacks.send_play != undefined) {
						this.status = ST_WAITING;
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

				switch(this.board.get_pos(row, col)) {
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
						this.board.put_stone("B", row, col);
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
						this.board.put_stone("W", row, col);
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
				var target = this.board.get_pos(row, col);
				if (target == undefined) {
					return false;
				}
				if (this.mode == "count") {
					if (this.shower != undefined) {
						this.shower.clear_dead_groups(this.score.dead_groups);
					}
					if (shift) {
						this.score.revive_stone(target, row, col);
					} else {
						if (this.score.can_kill_stone(target, row, col)) {
							this.score.kill_stone(target, row, col);
						}
					}
					this.draw_score();
				} else {
					var bChanged; // True if can revive or kill stone.
					// Check
					if (shift) {
						bChanged = this.score.can_revive_stone(target, row, col);
					} else {
						bChanged = this.score.can_kill_stone(target, row, col);
					}
					// POST
					if (bChanged) {
						if (this.callbacks.send_score_state != undefined) {
							this.status = ST_WAITING;
							this.callbacks.send_score_state(";" + (shift ? 'A' : 'D') + "[" + this.pos_to_sgf_coord(row, col) + "]");
						}
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
		if (this.board.get_pos(row, col) != undefined) {
			return false;
		}
		// Can't place a stone on ko.
		if (this.board.pos_is_ko(row, col)) {
			return false;
		}

		// Place stone
		var tmp_play = new Play(this.get_next_move(), row, col);

		// Eat stones if surrounded
		this.board.play_eat(tmp_play);

		// Check suicide
		if (this.board.play_check_suicide(tmp_play)) {
			return false;
		}

		// Update play's ko.
		this.board.play_check_ko(tmp_play);

		// Update play's captures
		this.update_play_captures(tmp_play);

		return tmp_play;
	},

	// Takes a play, appends it to the game_tree, updates the grid, the shower and changes next_move
	commit_play: function(play, node_source, wait) {
		this.game_tree.append(new GameNode(play, node_source), (node_source != NODE_VARIATION));
		this.board.make_play(play);
		if (this.shower) {
			this.shower.draw_play(play, wait);
			this.shower.update_captures(play);
			this.shower.update_move_number(this.game_tree.actual_move);
		}
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

	get_captured_count: function() {
		var play = this.game_tree.actual_move.play;
		if (play == undefined || play == null) {
			return {"B": 0, "W": 0};
		} else {
			return play.captured;
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

	pass: function() {
		var bRes;
		switch(this.mode) {
			case "play":
				// Color
				var color = this.get_next_move();

				// Time
				var time_left = this.time.pause(true);

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

				this.time.resume(this.get_next_move());

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
				var tmp_remain = this.time.pause(true);

				// Play
				var tmp_play = new Pass(color);
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
				if (typeof KAYAGLOBAL != "undefined") {
					KAYAGLOBAL.play_sound("pass");
				}
				// TODO: turn count sucks monkey ass
				this.turn_count++;

				// Send Play Callback
				if (this.callbacks.send_play != undefined) {
					this.status = ST_WAITING;
					this.callbacks.send_play(this.data_to_sgf_node(tmp_play, tmp_remain));
				}

				bRes = true;

			break;
		}

		return bRes;
	},

	get_ko: function() {
		return this.game_tree.actual_move.play && this.game_tree.actual_move.play.ko;
	},

	is_my_turn: function() {
		return (this.my_colour == "A" || this.my_colour == this.get_next_move());
	},


// Auxiliar functions
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
		var new_grid = Array(this.board.size);
		for (var i = 0, li = this.board.size; i < li; ++i) {
			new_grid[i] = Array(li);
		}
		this.tracks[id] = new Track(new_grid, this.game_tree.root);

		// Populate grid if root node has play.
		var prev_id = this.actual_track;
		var play = this.game_tree.root.play;
		if (play) {
			this.switch_to_track(id, true);
			this.board.make_play(play);
			this.switch_to_track(prev_id, true);
		}
		return id;
	},

	duplicate_actual_track: function(force_id) {
		var id = this.get_next_track_id(force_id);
		var new_grid = [];
		for (var i = 0, li = this.board.size; i < li; ++i) {
			new_grid.push(this.board.grid[i].slice());
		}
		this.tracks[id] = new Track(new_grid, this.game_tree.actual_move);
		return id;
	},

	load_track: function(path, variation, force_id) {
		// Validate path
		var rex = /^((\d+|\d+-\d+)+(\|(\d+|\d+-\d+))*|(\d+|\d+-\d+)|(root))$/;
		if (!rex.test(path)) {
			return false;
		}
		// Validate variation format
		var rex = /^([a-s]{2})*$/;
		if (!rex.test(variation)) {
			return false;
		}
		// Save actual track id
		var old = this.actual_track;

		// Create empty track
		var id = this.create_empty_track(force_id);

		// Switch to new track
		this.switch_to_track(id, true);

			// Go to variation root
			this.goto_path(path, true);

			if (variation != "") {
				variation = this.ungovar(variation, this.get_next_move());
				// Validate new variation format
				var rex = /^(\;(B|W)\[[a-s]{2}\])*$/;
				if (!rex.test(variation)) {
					return false;
				}

				// Parse and load moves.
				var sgf = new SGFParser("(;FF[4]" + variation + ")");
				sgf.sgf_to_tree(this, sgf.root.last_next, this.game_tree.actual_move, NODE_VARIATION);
			}

		// Switch to old track
		this.switch_to_track(old, true);
		return id;
	},

	switch_to_track: function(id, no_redraw) {
		if (!(this.tracks[id] instanceof Track)) {
			return false;
		}
		this.board.grid = this.tracks[id].grid;
		this.tracks[this.actual_track].head = this.game_tree.actual_move;
		this.game_tree.actual_move = this.tracks[id].head;
		this.actual_track = id;
		if (!no_redraw) {
			if (this.shower != undefined) {
				this.shower.redraw();
			}
			this.handle_score_agreement();
			this.render_tree();
		}
		return true;
	},

	draw_variation_numbers: function() {
		if (this.shower != undefined) {
			this.shower.draw_variation_numbers();
		}
	},

	var_to_string: function(tail) {
		var s_res = "";
		var tmp_node = this.game_tree.actual_move;
		while((tmp_node.source == NODE_VARIATION || !tail) && !tmp_node.root) {
			s_res = this.pos_to_sgf_coord(tmp_node.play.put.row, tmp_node.play.put.col) + s_res;
			tmp_node = tmp_node.prev;
		}
		if (!tail && tmp_node.root && tmp_node.play) {
			s_res = this.pos_to_sgf_coord(tmp_node.play.put.row, tmp_node.play.put.col) + s_res;
		} else {
			s_res = tmp_node.get_path() + " " + s_res;
		}
		return s_res;
	},

	govar: function() {
		return this.var_to_string(true);
	},

	ungovar: function(variation, first_color) {
		var color = [];
		color[0] = first_color;
		color[1] = (first_color == "W" ? "B" : "W");
		var var_arr = variation.match(/([a-s][a-s])/g);
		var s = "";
		for (var i = 0, li = var_arr.length; i < li; ++i) {
			s += ";" + color[i % 2] + "[" + var_arr[i] + "]";
		}
		return s;
	},

//	To be changed to callback
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
			if (mode != "free") {
				this.time.resume(this.get_next_move());
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
			this.time.pause();
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
		this.score = new Score(this.ruleset, this.board.grid);
		var score = this.score.calculate_score();
		this.score.calculate_result(this.get_captured_count(), this.komi);
		if (this.shower != undefined) {
			this.shower.clear_last_stone_markers();
			this.shower.clear_ko();
			this.shower.draw_score(score);
			this.shower.update_score(this.score.score);
			this.shower.update_result(this.score.result);
			if (this.callbacks.score_result_updated != undefined) {
				this.callbacks.score_result_updated(this.score.result);
			}
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
		if (this.board.size != size) {
			this.board.size = size;
			this.clear(true);
			this.render(true);
			this.render_tree();
		}
	},

	change_komi: function(komi) {
		if (typeof komi != "number") {
			throw new Error("The 'komi' parameter must be a number");
		}
		this.komi = komi;
	},

	clear: function(hard) {
		// Grid
		this.board.grid = Array(this.board.size);
		for (var row = 0 ; row < this.board.size ; row++) {
			this.board.grid[row] = Array(this.board.size);
		}

		// Timer
		this.time.clear();

		// Score
		this.score = undefined;
		if (this.args.mode != undefined) {
			this.mode = this.args.mode;
		} else {
			this.mode = "play";
		}

		// SGFParser
		if (this.sgf != undefined) {
			this.sgf.init(this.sgf.sgf);
		}

		// GameTree
		var that = this;
		if (this.game_tree.graphic != undefined && this.game_tree.graphic.div_tree != undefined) {
			var div_id_tree = this.game_tree.graphic.div_tree.id;
		}
		this.game_tree = new GameTree(div_id_tree, function(path) {
			if (that.callbacks.send_focus != undefined) {
				that.callbacks.send_focus(path);
			} else {
				that.goto_path.call(that, path);
			}
		});

		// Tracks
		this.tracks = [];
		this.tracks[TRACK_ONLINE] = new Track(this.board.grid, this.game_tree.actual_move);
		this.actual_track = TRACK_ONLINE;

		// Game
		// TODO: turn count sucks monkey ass
		this.turn_count = 0;

		// Clear shower
		if (this.shower != undefined) {
			this.shower.clear(hard);
		}
	},

	render: function(hard) {
		if (this.shower) {
			this.shower.render(hard);
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
		this.time.resume(this.get_next_move());
		*/
	},

	disconnect: function() {
		/*
		// TODO: guess what is the best thing to do with timer when jugs disconnect.
		this.time.pause();
		*/
		this.connected = false;
	},

	set_ready: function() {
		this.status = ST_READY;
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
			switch(this.time.clock.system.name) {
				case "Absolute":
				case "Fischer":
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

	confirm_play: function() {
		if (this.shower != undefined) {
			var play = this.game_tree.actual_move.play;
			if (play instanceof Play) {
				this.shower.confirm_play(play.put);
			}
		}
	},

	new_diff_update_game: function(data) {
		// Check SGF status:
		if (this.sgf == undefined || this.sgf == null || this.sgf.status != SGFPARSER_ST_LOADED) {
			// Not loaded: load from scratch.
			this.update_game(data);
		} else {
			// Loaded: diff update.
			if (data.result != undefined) {
				this.time.stop();
			} else {
				this.time.pause();
			}

			// Clear and change size if required
			if (data.size != undefined && data.size != this.board.size) {
				this.change_size(Number(data.size));
			}

			// Compare SGF and add only new moves + update score state if not attached.
			var move_added;
			if (data.moves != undefined) {
				if (!this.is_attached()) {
					this.attach_head(true);
					move_added = this.sgf.new_add_moves(this, data.moves);
					if (data.focus) {
						this.goto_path(data.focus, true);
					}
					this.update_raw_score_state(data.raw_score_state);
					this.time.update(data.time_adjustment);
					if (move_added) {
						move_added = this.game_tree.actual_move;
					}
					this.detach_head(true);
				} else {
					move_added = this.sgf.new_add_moves(this, data.moves);
					if (data.focus) {
						this.goto_path(data.focus);
					}
					if (move_added) {
						move_added = this.game_tree.actual_move;
					}
				}
			}

			// Play sound!
			if (typeof KAYAGLOBAL != "undefined") {
				if (move_added.play instanceof Play) {
					KAYAGLOBAL.play_sound(move_added.play.put.color);
					if (this.callbacks.announce_play != undefined) {
						this.callbacks.announce_play(move_added.play.put.color);
					}
				} else if (move_added.play instanceof Pass) {
					KAYAGLOBAL.play_sound("pass");
					if (this.callbacks.announce_pass != undefined) {
						this.callbacks.announce_pass(move_added.play.put.color);
					}
				}
			}

			if (this.is_attached()) {
				// Fast forward
				if (!data.focus) {
					this.goto_end();
				}
				this.handle_score_agreement(data.raw_score_state);
				this.time.update(data.time_adjustment);
			}

			this.status = ST_READY;
		}
	},

	diff_update_game: function(data) {
		// Check SGF status:
		if (this.sgf == undefined || this.sgf == null || this.sgf.status != SGFPARSER_ST_LOADED) {
			// Not loaded: load from scratch.
			this.update_game(data);
		} else {
			// Loaded: diff update.
			if (data.result != undefined) {
				this.time.stop();
			} else {
				this.time.pause();
			}

			// Clear and change size if required
			if (data.size != undefined && data.size != this.board.size) {
				this.change_size(Number(data.size));
			}

			// Compare SGF and add only new moves + update score state if not attached.
			var move_added = false;
			if (data.moves != undefined) {
				if (!this.is_attached()) {
					this.attach_head(true);
					move_added = this.sgf.add_moves(this, data.moves, true);
					// XXX metodo cabeza para soportar UNDO.
					if (move_added) {
						this.update_raw_score_state(data.raw_score_state);
						this.time.update(data.time_adjustment);
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
			if (typeof KAYAGLOBAL != "undefined") {
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
				this.time.update(data.time_adjustment);
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
		this.time.update(data.time_adjustment);
		this.last_play_announcement();

		// Stop timer when game ends
		if (data.result != undefined) {
			this.time.stop();
		}

		this.status = ST_READY;
	},

	last_play_announcement: function() {
		var play = this.game_tree.actual_move.play;
		if (play instanceof Play) {
			if (this.callbacks.announce_play) {
				this.callbacks.announce_play(play.put.color);
			}
		} else if (play instanceof Pass) {
			if (this.callbacks.announce_pass) {
				this.callbacks.announce_pass(play.put.color);
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
			sSgf += this.time.settings_to_sgf(data.time_settings);
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
			if (this.board.safe_get_pos(row, col) != "") {
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
		if (states != undefined && states != "") {
			states = states.match(/;(A|D)\[[a-s]{2}\]/g);
			if (states != undefined) {
				for (var i = 0, li = states.length; i < li; ++i) {
					var alive = (states[i].charAt(1) == "A");
					var pos = this.sgf_coord_to_pos(states[i].match(/[a-s]{2}/)[0]);
					var target = this.board.get_pos(pos.row, pos.col);
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
		}
		this.draw_score();
	},

	draw_score: function() {
		var score = this.score.calculate_score();
		this.score.calculate_result(this.get_captured_count(), this.komi);
		if (this.shower != undefined) {
			this.shower.clear_score();
			this.shower.draw_dead_groups(this.score.dead_groups);
			this.shower.draw_score(score);
			this.shower.update_score(this.score.score);
			this.shower.update_result(this.score.result);
			if (this.callbacks.score_result_updated != undefined) {
				this.callbacks.score_result_updated(this.score.result);
			}
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
