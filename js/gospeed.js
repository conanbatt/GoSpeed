
function GoSpeed(args) {
	this.init.apply(this, [args]);
}

GoSpeed.prototype = {
	init: function() {
		this.validate(arguments);

		var args = arguments[0];

		this.size = args.size;
		this.mode = args.mode;
		this.ruleset = args.ruleset;
		this.grid = Array(this.size);
		for (row = 0 ; row < this.size ; row++) {
			this.grid[row] = Array(this.size);
		}
		this.next_move = "B";
		if (args.div_id != undefined) {
			if (args.shower != undefined) {
				if (args.shower == "basic") {
					this.shower = new GoShower(this, args.div_id);
				} else if (args.shower == "graphic") {
					this.shower = new GoGraphic(this, args.div_id);
				}
			}
		}
		this.play_summary = [];
		this.last_play = []
		this.ko = undefined;

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
		this.last_play.push({fact: "P", row: row, col: col});
		if (this.shower) {
			this.shower.put_stone(color, row, col);
		}
	},

	remove_stone: function(row, col) {
		if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
			throw new Error("Position out of board");
		}
		this.grid[row][col] = undefined;
		this.last_play.push({fact: "R", row: row, col: col});
		if (this.shower) {
			this.shower.remove_stone(row, col);
		}
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

//	Plays and Moves
	undo_play: function() {
		var color = (this.next_move == "W" ? "B" : "W");
		var play = this.last_play;
		for (move in play) {
			switch(play[move].fact) {
				case "P":
					this.remove_stone(play[move].row, play[move].col);
				break;
				case "R":
					this.put_stone(color, play[move].row, play[move].col);
				break;
			}
		}
		this.last_play = [];
	},

	is_same_play: function(a, b) {
		if (a == undefined || b == undefined) {
			return false;
		}
		if (a.length != b.length) {
			return false;
		}
		outerloop:
		for (move in a) {
			for (mobe in b) {
				if (this.is_same_move(a[move], b[mobe])) {
					continue outerloop;
				}
			}
			return false;
		}
		return true;
	},

	is_same_move: function(a, b) {
		for (item in a) {
			if (a[item] != b[item]) {
				return false;
			}
		}
		return true;
	},

	complementary_play: function(play) {
		var comp_play = []
		for (move in play) {
			comp_play.push({fact: (play[move].fact == "P" ? "R" : "P"), row: play[move].row, col: play[move].col});
		}
		return comp_play;
	},

//	Gameplay
	check_ko: function() {
		var play = this.play_summary[this.play_summary.length - 1];
		var color = this.next_move;
		var i = 0;
		if (play.length == 2) {
			for (i in play) {
				if (play[i].fact == "R") {
					break;
				}
			}
			this.put_stone(color, play[i].row, play[i].col);
			this.eat(play[i].row, play[i].col);
			if (this.is_same_play(this.last_play, this.complementary_play(play))) {
				this.undo_play();
				this.ko = {row: play[i].row, col: play[i].col};
				if (this.shower) {
					this.shower.place_ko(this.ko);
				}
			} else {
				this.undo_play();
			}
		}
	},

	play: function(row, col) {
		switch(this.mode) {
			case "play":

				// Can't override a stone
				if (this.get_pos(row, col) != undefined) {
					return;
				}
				// Can't place a stone on ko.
				if (this.ko != undefined) {
					if (this.ko.row == row && this.ko.col == col) {
						return;
					}
				}

				// Place stone
				this.put_stone(this.next_move, row, col);

				// Eat stones if surrounded
				this.eat(row, col);

				// Check illegal move
				var stone = {color: this.next_move, row: row, col: col};
				var chain;
				if (this.count_stone_liberties(stone) == 0) {
					chain = this.get_distinct_chains([stone])[0];
					if (this.chain_is_restricted(chain)) {
						this.remove_stone(row, col);
						this.last_play = [];
						return;
					}
				}

				// Commits play
				this.play_summary.push(this.last_play);
				this.last_play = [];
				this.next_move = (this.next_move == "W" ? "B" : "W");

				// Clear ko when plays elsewhere
				if (this.ko != undefined) {
					if (this.shower) {
						this.shower.clear_ko(this.ko);
					}
					this.ko = undefined;
				}

				// Checks ko
				this.check_ko();

			break;
			case "free":
				switch(this.get_pos(row, col)) {
					case "W":
						this.remove_stone(row, col);
						this.put_stone("B", row, col);
					break;
					case "B":
						this.remove_stone(row, col);
					break;
					default:
						this.put_stone("W", row, col);
					break;
				}
			break;
		}
	},

	eat: function(row, col) {
		var adj = this.get_adjacent((this.next_move == "W" ? "B" : "W"), row, col);
		var chains = this.get_distinct_chains(adj);

		for (chain in chains) {
			if (this.chain_is_restricted(chains[chain])) {
				for (stone in chains[chain]) {
					this.remove_stone(chains[chain][stone].row, chains[chain][stone].col);
				}
			}
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
				args.mode = "free";
			} else if (typeof mode == "string") {
				if (mode != "play" && mode != "free") {
					throw new Error("The 'mode' parameter must be 'play' or 'free'.");
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

			// Shower
			if (typeof shower != "undefined") {
				if (typeof shower != "string") {
					throw new Error("The 'shower' parameter must be a string");
				} else if (shower != "graphic" && shower != "basic") {
					throw new Error("The 'shower' parameter must be 'basic' or 'graphic'.");
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
			args.mode = "free";
		} else if (typeof mode == "string") {
			if (mode != "play" && mode != "free" && mode != "count") {
				throw new Error("The 'mode' parameter must be 'play', 'free' or 'count'.");
			}
		} else {
			throw new Error("The 'mode' parameter must be a string");
		}
		this.mode = mode;
	},
}

