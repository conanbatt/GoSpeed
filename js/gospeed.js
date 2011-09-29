
function GoSpeed(args) {
	this.init.apply(this, [args]);
}

GoSpeed.prototype = {
	init: function() {
	// Validation
		this.validate(arguments);
		var args = arguments[0];

	// Setup
		this.size = args.size;
		this.mode = args.mode;
		this.ruleset = args.ruleset;
		this.next_move = "B";
		this.ko = undefined;

	// Grid
		this.grid = Array(this.size);
		for (var row = 0 ; row < this.size ; row++) {
			this.grid[row] = Array(this.size);
		}

	// Shower
		if (args.div_id != undefined) {
			// Read div contents
			var tmp_div = document.getElementById(args.div_id);
			if (tmp_div && tmp_div.innerHTML != "") {
				this.sgf = new SGFParser(tmp_div.innerHTML);
			}
			// Define the showing engine
			if (args.shower != undefined) {
				if (args.shower == "basic") {
					this.shower = new GoShower(this, args.div_id);
				} else if (args.shower == "graphic") {
					this.shower = new GoGraphic(this, args.div_id);
				}
			}
		}

	// GameTree
		this.game_tree = new GameTree();
		if (args.tree_div_id != undefined) {
			this.tree_div = document.getElementById(args.tree_div_id);
		}

	// Online
		if (args.my_colour != undefined) {
			this.my_colour = args.my_colour;
		}

	// Game
		this.turn_count = 0;
		this.captured = {B: 0, W: 0};

	// Paths
		if (args.server_path_game_move != undefined) {
			this.server_path_game_move = args.server_path_game_move;
		}
		if (args.server_path_gospeed_root != undefined) {
			this.server_path_gospeed_root = args.server_path_gospeed_root;
		}

	// Render
		this.render();
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
		if (this.ko != undefined) {
			if (this.ko.row == row && this.ko.col == col) {
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
		} else {
			this.put_stone(play.put.color, play.put.row, play.put.col);
			for (var stone in play.remove) {
				this.remove_stone(play.remove[stone].row, play.remove[stone].col);
				this.captured[play.remove[stone].color]++;
			}
			this.ko = play.ko;
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
		} else {
			this.remove_stone(play.put.row, play.put.col);
			for (var stone in play.remove) {
				this.put_stone(play.remove[stone].color, play.remove[stone].row, play.remove[stone].col);
				this.captured[play.remove[stone].color]--;
			}
			this.ko = undefined;
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

	// Takes a play and spreads it's ko property value to the game.
	refresh_ko: function(play) {
		this.ko = play.ko;
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
	commit_play: function(play) {
		this.game_tree.append(new GameNode(play));
		this.make_play(play);
		if (this.shower) {
			this.shower.draw_play(play);
		}
		this.next_move = (this.next_move == "W" ? "B" : "W");
	},

//	Game Seek
	prev: function() {
		var play = this.game_tree.prev();
		if (play) {
			this.undo_play(play);
			if (this.shower) {
				this.shower.undraw_play(play);
			}
			if (play instanceof Play) {
				this.next_move = (this.next_move == "W" ? "B" : "W");
			}
		}

		play = this.game_tree.actual_move.play;
		if (play) {
			this.refresh_ko(play);
			if (this.shower) {
				this.shower.refresh_ko(play);
			}
		}

		if (this.shower) {
			this.shower.clean_t_stones();
		}

		this.render_tree();
	},

	next: function() {
		var play = this.game_tree.next();
		if (play) {
			this.make_play(play);
			if (this.shower) {
				this.shower.draw_play(play);
			}
		} else {
			return false;
		}

		if (play instanceof Play) {
			this.next_move = (this.next_move == "W" ? "B" : "W");
		}

		if (this.shower) {
			this.shower.clean_t_stones();
		}

		this.render_tree();
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

	goto_end: function() {
		while (this.next()) {
			continue;
		}
	},

//	Gameplay
	play: function(row, col) {
		var bRes = false;
		var tmp_play;
		switch(this.mode) {
			case "play":
				// Setup
				tmp_play = this.setup_play(row, col);

				if (tmp_play) {
					// Commit
					this.commit_play(tmp_play);
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
					// Commit
					this.commit_play(tmp_play);
					this.send_play(tmp_play);
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
		}

		if (bRes) {
			this.render_tree();
		}

		return bRes;
	},

	play_ad_hoc: function(row, col) {
		if (this.mode == "play_online" || this.mode == "play") {
			var bRes = false;

			// Setup
			var play = this.setup_play(row, col);

			if (play) {
				// Commit
				this.commit_play(tmp_play);
				this.turn_count++;
				bRes = true;
			}

			return bRes;
		}
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
		var tmp_play = new Play(this.next_move, row, col);

		// Eat stones if surrounded
		this.play_eat(tmp_play);

		// Check suicide
		if (this.play_check_suicide(tmp_play)) {
			return false;
		}

		// Update play's ko.
		this.play_check_ko(tmp_play);

		return tmp_play;
	},

	update_game: function(data) {
		var ext_game = data.split(",");
		var ext_play;
		while(this.turn_count < ext_game.length) {
			if (ext_game[this.turn_count] == "") {
				break;
			} else {
				ext_play = this.string_to_play(ext_game[this.turn_count]);
				if (!this.play_ad_hoc(ext_play.row, ext_play.col)) {
					alert("Choque");
					break;
				}
			}
		}
	},

	is_my_turn: function() {
		return this.my_colour == this.next_move;
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

//	Config commands
	change_mode: function(mode) {
		var modes = ["play", "play_online", "free", "count",];
		if (typeof mode == "string") {
			if (!inArray(mode, modes)) {
				throw new Error("The 'mode' parameter must be in (" + modes + ").");
			}
		} else {
			throw new Error("The 'mode' parameter must be a string");
		}
		this.mode = mode;
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
		var colours = ["B", "W", "O",];
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

	clear: function() {
		this.next_move = "B";
		this.ko = undefined;

		// Grid
		this.grid = Array(this.size);
		for (var row = 0 ; row < this.size ; row++) {
			this.grid[row] = Array(this.size);
		}

		// GameTree
		this.game_tree = new GameTree();

		// Clear shower
		this.shower.clear();

		// Game
		this.turn_count = 0;
		this.captured = {B: 0, W: 0};
	},

	load_sgf: function() {
		if (this.sgf != undefined) {
			var pend_sgf_node = [];
			var pend_game_tree_node = [];

			if (!this.sgf.root) {
				return;
			}
			// Setup based on root node properties.
			var sgf_node = this.sgf.root;
			if (sgf_node.RU != undefined) {
				this.change_ruleset(sgf_node.RU);
			}
			if (sgf_node.SZ != undefined) {
				this.change_size(Number(sgf_node.SZ));
			}
			if (sgf_node.HA != undefined) {
				this.next_move = "W";
				if (sgf_node.AB != undefined) {
					sgf_node.AB = [].concat(sgf_node.AB);
					var handicap = new FreePlay();
					this.game_tree.root.play = handicap;
					for (var key in sgf_node.AB) {
						handicap.put.push(new Stone("B", sgf_node.AB[key].charCodeAt(1) - 97, sgf_node.AB[key].charCodeAt(0) - 97));
					}
					this.make_play(handicap);
					if (this.shower != undefined) {
						this.shower.draw_play(handicap);
					}
				}
			} else {
				this.next_move = "B";
			}

			// Push roots to start "recursive-like" iteration.
			pend_sgf_node.push(this.sgf.root);
			pend_game_tree_node.push(this.game_tree.root)

			var move;
			var tmp;
			var tree_node;
			while(sgf_node = pend_sgf_node.pop()) {
				tree_node = pend_game_tree_node.pop();
				tree_node.last_next = tree_node.next[0];
			// do: rewind game until reaches this tree_node.
				while (this.game_tree.actual_move != tree_node) {
					tmp = this.game_tree.prev();
					this.undo_play(tmp);
					if (tmp instanceof Play) {
						this.next_move = (this.next_move == "W" ? "B" : "W");
					}
				}
			// do: play sgf_node contents at this point in game.
				// FIXME: quisiera ver cuál es la mejor manera de validar que el sgf hizo la jugada correcta sin tener que confiar en next_move que podría romperse
				if (sgf_node.B || sgf_node.W) {
					if (this.next_move == "B" && sgf_node.B) {
						move = sgf_node.B;
					} else if (sgf_node.W) {
						move = sgf_node.W;
					} else {
						throw new Error("Turn and Play mismatch");
						return false;
					}
					if (move == "" || move == "tt") {
						//this.pass();
						this.turn_count++;
						throw new Error("Pass not implemented");
						return false;
					} else {
						tmp = this.setup_play(move.charCodeAt(1) - 97, move.charCodeAt(0) - 97);
						if (!tmp) {
							throw new Error("Illegal move or such...");
							return false;
						}
						this.game_tree.append(new GameNode(tmp));
						this.make_play(tmp);
						if (tmp instanceof Play) {
							this.next_move = (this.next_move == "W" ? "B" : "W");
						}
						this.turn_count++;
					}
				}
			// do: push actual_node to pend_game_tree_node
			// do: push sgf_node.next nodes to pend_sgf_node
				for (var key in sgf_node.next) {
					pend_sgf_node.push(sgf_node.next[key]);
					pend_game_tree_node.push(this.game_tree.actual_move);
				}
			}

			while (this.game_tree.actual_move != this.game_tree.root) {
				tmp = this.game_tree.prev();
				this.undo_play(tmp);
				if (tmp instanceof Play) {
					this.next_move = (this.next_move == "W" ? "B" : "W");
				}
			}

			this.render_tree();

		} else {
			throw new Error("Empty / Wrong SGF");
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

//	Validation
	validate: function(rgmnts) {
		var args;
		if (rgmnts[0]) {
			args = rgmnts[0];
		} else {
			rgmnts[0] = {};
			args = rgmnts[0];
		}

		var options;

		with (args) {
		// Size
			if (typeof size == "undefined") {
				args.size = 19;
			} else if (typeof size == "number") {
				options = [9, 13, 19,];
				if (!inArray(size, options)) {
					throw new Error("The 'size' parameter must be in (" + options + ").");
				}
			} else {
				throw new Error("The 'size' parameter must be a number");
			}

		// Mode
			if (typeof mode == "undefined") {
				args.mode = "play";
			} else if (typeof mode == "string") {
				options = ["play", "play_online", "free", "count",];
				if (!inArray(mode, options)) {
					throw new Error("The 'mode' parameter must be in (" + options + ").");
				}
			} else {
				throw new Error("The 'mode' parameter must be a string");
			}

		// Ruleset
			if (typeof ruleset == "undefined") {
				args.ruleset = "Japanese";
			} else if (typeof ruleset == "string") {
				options = ["Japanese", "Chinese",];
				if (!inArray(ruleset, options)) {
					throw new Error("The 'ruleset' parameter must be in (" + options + ").");
				}
			} else {
				throw new Error("The 'ruleset' parameter must be a string");
			}

		// DivID
			if (typeof div_id != "undefined") {
				if (typeof div_id != "string") {
					throw new Error("The 'div_id' parameter must be a string");
				} else if (!document.getElementById(div_id)) {
					throw new Error("The 'div_id' parameter points to no existing div.");
				}
			}

		// TreeDivID
			if (typeof tree_div_id != "undefined") {
				if (typeof tree_div_id != "string") {
					throw new Error("The 'tree_div_id' parameter must be a string");
				} else if (!document.getElementById(tree_div_id)) {
					throw new Error("The 'tree_div_id' parameter points to no existing div.");
				}
			}

		// Shower
			if (typeof shower != "undefined") {
				if (typeof shower != "string") {
					throw new Error("The 'shower' parameter must be a string");
				} else {
					options = ["shower", "graphic",];
					if (!inArray(shower, options)) {
						throw new Error("The 'shower' parameter must be in (" + options + ").");
					}
				}
			}

		// Colour
			if (typeof my_colour != "undefined") {
				if (typeof my_colour != "string") {
					throw new Error("The 'my_colour' parameter must be a string");
				} else {
					options = ["B", "W", "O",];
					if (!inArray(my_colour, options)) {
						throw new Error("The 'my_colour' parameter must be in (" + options + ").");
					}
				}
			}

		// Server Move Path
			if (typeof server_path_game_move != "undefined") {
				if (typeof server_path_game_move != "string") {
					throw new Error("The 'server_path_game_move' parameter must be a string");
				} else {
					if (server_path_game_move == "") {
						throw new Error("The 'server_path_game_move' parameter must not be empty");
					}
				}
			}

		// Server Resources Path
			if (typeof server_path_gospeed_root != "undefined") {
				if (typeof server_path_gospeed_root != "string") {
					throw new Error("The 'server_path_gospeed_root' parameter must be a string");
				} else {
					if (server_path_gospeed_root == "") {
						throw new Error("The 'server_path_gospeed_root' parameter must not be empty");
					} else {
						if (server_path_gospeed_root.charAt(server_path_gospeed_root.length - 1) != '/') {
							args.server_path_gospeed_root += '/';
						}
					}
				}
			}
		}
	},

// Online helpers
	string_to_play: function(data) {
		var row_patt = /^[A-Z]/;
		var row = row_patt.exec(data)[0];
		row = row.charCodeAt(0) - 65;
		var col_patt = /[0-9]*$/;
		var col = parseInt(col_patt.exec(data)[0], 10);
		return {row: row, col: col};
	},

	coord_converter: function(play) {
		return ";" + play.put.color + "[" + String.fromCharCode(97 + play.put.col) + String.fromCharCode(97 + play.put.row) + "]";
	},

	send_play: function(play) {
		if (this.server_path_game_move != undefined) {
			$.post(this.server_path_game_move, {move: this.coord_converter(play)});
		}
	},
}

