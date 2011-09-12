
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
		for (row = 0 ; row < this.size ; row++) {
			this.grid[row] = Array(this.size);
		}

		// Shower
		if (args.div_id != undefined) {
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
		if (args.tree_div_id) {
			this.tree_div = document.getElementById(args.tree_div_id);
		}

		// Online
		this.my_colour = args.my_colour;
		this.my_turn = (this.my_colour == "B");
		this.turn_count = 0;

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
	make_play: function(play) {
		if (play instanceof FreePlay) {
			for (stone in play.remove) {
				this.remove_stone(play.remove[stone].row, play.remove[stone].col);
			}
			for (stone in play.put) {
				this.put_stone(play.put[stone].color, play.put[stone].row, play.put[stone].col);
			}
		} else {
			this.put_stone(play.put.color, play.put.row, play.put.col);
			for (stone in play.remove) {
				this.remove_stone(play.remove[stone].row, play.remove[stone].col);
			}
			if (play.ko) {
				this.ko = play.ko;
				if (this.shower) {
					this.shower.place_ko(this.ko);
				}
			} else {
				this.ko = null;
				if (this.shower) {
					this.shower.clear_ko();
				}
			}
		}
	},

	undo_play: function(play) {
		if (play instanceof FreePlay) {
			for (stone in play.put) {
				this.remove_stone(play.put[stone].row, play.put[stone].col);
			}
			for (stone in play.remove) {
				this.put_stone(play.remove[stone].color, play.remove[stone].row, play.remove[stone].col);
			}
		} else {
			this.remove_stone(play.put.row, play.put.col);
			for (stone in play.remove) {
				this.put_stone(play.remove[stone].color, play.remove[stone].row, play.remove[stone].col);
			}
		}
	},

	play_eat: function(play) {
		this.put_stone(play.put.color, play.put.row, play.put.col);

		var target_color = (play.put.color == "W" ? "B" : "W");
		var adj = this.get_touched(target_color, play.put.row, play.put.col);
		var chains = this.get_distinct_chains(adj);

		for (chain in chains) {
			if (this.chain_is_restricted(chains[chain])) {
				for (stone in chains[chain]) {
					play.remove.push(new Stone(target_color, chains[chain][stone].row, chains[chain][stone].col));
				}
			}
		}

		this.remove_stone(play.put.row, play.put.col);
	},

	play_check_ko: function() {
		var play = this.game_tree.actual_move.play;
		var color = this.next_move;
		var is_ko = false;
		var i = 0;
		if (play.remove.length == 1) {
			var tmp_play = new Play(play.remove[0].color, play.remove[0].row, play.remove[0].col);
			this.play_eat(tmp_play);
			if (tmp_play.remove.length == 1) {
				if (play.put.equals(tmp_play.remove[0]) && tmp_play.put.equals(play.remove[0])) {
					is_ko = true;
				}
			}
		}
		if (is_ko) {
			play.ko = {row: tmp_play.put.row, col: tmp_play.put.col};
			this.ko = play.ko;
			if (this.shower) {
				this.shower.place_ko(this.ko);
			}
		} else {
			if (this.ko != undefined) {
				if (this.shower) {
					this.shower.clear_ko(this.ko);
				}
				this.ko = undefined;
			}
		}
	},

	check_illegal_move: function(play) {
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
			if (play.ko) {
				this.ko = play.ko;
				if (this.shower) {
					this.shower.place_ko(this.ko);
				}
			} else {
				this.ko = null;
				if (this.shower) {
					this.shower.clear_ko();
				}
			}
		}
		this.shower.clean_t_stones();

		this.renderTree();
	},

	next: function() {
		var play = this.game_tree.next();
		if (play) {
			this.make_play(play);
			if (this.shower) {
				this.shower.draw_play(play);
			}
		}
		if (play instanceof Play) {
			this.next_move = (this.next_move == "W" ? "B" : "W");
		}
		this.shower.clean_t_stones();

		this.renderTree();
	},

	up: function() {
		this.game_tree.up();

		this.renderTree();
	},

	down: function() {
		this.game_tree.down();

		this.renderTree();
	},

//	Gameplay
	play: function(row, col) {
		switch(this.mode) {
			case "play":

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

				// Check illegal move
				if (this.check_illegal_move(tmp_play)) {
					return false;
				}

				// Commits play (changes next_move)
				this.commit_play(tmp_play);

				// Checks KO: clear or set depending on result
				this.play_check_ko();

			break;
			case "play_online":
				// Not my turn.
				if (!this.my_turn) {
					return false;
				}

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

				// Check illegal move
				if (this.check_illegal_move(tmp_play)) {
					return false;
				}

				// Commits play (changes next_move)
				this.commit_play(tmp_play);

				// Checks KO: clear or set depending on result
				this.play_check_ko();

				this.send_play(row, col);
				this.my_turn = false;
				this.turn_count++;

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

			break;
		}

		this.renderTree();
	},

	extern_play: function(row, col) {
		if (this.mode == "play_online") {
			// My turn...
			if (this.my_turn) {
				return false;
			}

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

			// Check illegal move
			if (this.check_illegal_move(tmp_play)) {
				return false;
			}

			// Commits play (changes next_move)
			this.commit_play(tmp_play);

			// Checks KO: clear or set depending on result
			this.play_check_ko();

			this.my_turn = true;
			this.turn_count++;
		}
	},

	play_ad_hoc: function(row, col) {
		if (this.mode == "play_online") {
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

			// Check illegal move
			if (this.check_illegal_move(tmp_play)) {
				return false;
			}

			// Commits play (changes next_move)
			this.commit_play(tmp_play);

			// Checks KO: clear or set depending on result
			this.play_check_ko();

			this.turn_count++;
			return true;
		}
	},

	update_game: function(data) {
		var ext_game = data.split(",");
		var ext_play;
		//alert("ext_game.length = " + ext_game.length + "\nthis.turn_count = " + this.turn_count + "\nthis.next_move = " + this.next_move);
		while(this.turn_count < ext_game.length) {
			ext_play = this.string_to_play(ext_game[this.turn_count]);
			if (!this.play_ad_hoc(ext_play.row, ext_play.col)) {
				alert("Choque");
				break;
			}
		}
		if (this.next_move == this.my_colour) {
			this.my_turn = true;
		}
	},

//	Auxiliar functions
	chain_is_restricted: function(chain) {
		for (stone in chain) {
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
		for (item in list) {
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
		for (chain in chains_pend) {
			while (chains_pend[chain].length > 0) {
				touched = [];
				stone = chains_pend[chain].pop();
				touched = this.get_touched(stone.color, stone.row, stone.col);
				for (stone in touched) {
					if (this.list_has_stone(chains[chain], touched[stone])) {
						continue;
					} else {
						for (ch in chains) {
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

	renderTree: function() {
		if (this.tree_div) {
			this.tree_div.innerHTML = this.game_tree.toString();
		}
	},

//	Game Over
	territory_count: function() {
		return;
	},

//	Validation
	validate: function(rgmnts) {
		var args = rgmnts[0] || {};

		with (args) {
			// Size
			if (typeof size == "undefined") {
				args.size = 19;
			} else if (typeof size == "number") {
				if (size != 9 && size != 13 && size != 19) {
					throw new Error("The 'size' parameter must be 9, 13 or 19.");
				}
			} else {
				throw new Error("The 'size' parameter must be a number");
			}

			// Mode
			if (typeof mode == "undefined") {
				args.mode = "play";
			} else if (typeof mode == "string") {
				if (mode != "play" && mode != "play_online" && mode != "free" && mode != "count") {
					throw new Error("The 'mode' parameter must be 'play', 'play_online', 'free' or 'count'.");
				}
			} else {
				throw new Error("The 'mode' parameter must be a string");
			}

			// Ruleset
			if (typeof ruleset == "undefined") {
				args.ruleset = "Japanese";
			} else if (typeof ruleset == "string") {
				if (ruleset != "Japanese") {
					throw new Error("The 'ruleset' parameter must be 'Japanese'.");
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
				} else if (shower != "graphic" && shower != "basic") {
					throw new Error("The 'shower' parameter must be 'basic' or 'graphic'.");
				}
			}

			// Colour
			if (typeof my_colour != "undefined") {
				if (typeof my_colour != "string") {
					throw new Error("The 'my_colour' parameter must be a string");
				} else if (my_colour != "W" && my_colour != "B") {
					throw new Error("The 'my_colour' parameter must be 'W' or 'B'.");
				}
			}
		}
	},

	render: function() {
		if (this.shower) {
			this.shower.render();
		}
	},

	switch_mode: function(mode) {
		if (typeof mode == "undefined") {
			mode = "play";
		} else if (typeof mode == "string") {
			if (mode != "play" && mode != "play_online" && mode != "free" && mode != "count") {
				throw new Error("The 'mode' parameter must be 'play', 'play_online', 'free' or 'count'.");
			}
		} else {
			throw new Error("The 'mode' parameter must be a string");
		}
		this.mode = mode;
	},

	string_to_play: function(data) {
		var row_patt = /^[A-Z]/;
		var row = row_patt.exec(data)[0];
		row = row.charCodeAt(0) - 65;
		var col_patt = /[0-9]*$/;
		var col = parseInt(col_patt.exec(data)[0], 10);
		return {row: row, col: col};
	},

	coord_converter: function(row, col) {
		return String.fromCharCode(65 + row) + "-" + col
	},

	send_play: function(row, col) {
		$.post("/game/game_move", {move: this.coord_converter(row, col)});
	},
}

