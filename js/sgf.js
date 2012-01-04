var SGFPARSER_ST_ERROR = 1;//"ERROR"; // 1
var SGFPARSER_ST_PARSED = 2;//"PARSED"; // 2
var SGFPARSER_ST_LOADED = 4;//"LOADED"; // 4

function SGFNode() {
	this.prev = null;
	this.next = [];
	this.last_next = null;
}

SGFNode.prototype = {
	appendNext: function(node) {
		node.prev = this;
		this.next.push(node);
		if (this.last_next == null) {
			this.last_next = node;
		}
	}
}

function SGFParser(sSGF) {
	this.init.apply(this, [sSGF]);
}

SGFParser.prototype = {
	init: function(sSGF) {
		this.sgf = sSGF;
		this.root = null;
		this.pointer = null;
		this.last_node = null;
		this.moves_loaded = "";
		this.parse();
	},

	append_node: function(node) {
		if (this.pointer == this.root && !this.root.loaded) {
			for (var prop in node) {
				this.root[prop] = node[prop];
			}
			this.root.loaded = true;
		} else {
			node.prev = this.pointer;
			this.pointer.next.push(node);
			this.pointer.last_next = node;
			this.pointer = node;
			this.last_node = node;
		}
	},

	parse: function() {
		this.root = new SGFNode();
		this.pointer = this.root;
		this.last_node = this.root;
		var new_node;
		var nodes_for_var = [];	// Track the last node where a variation started.

		var chr = '';
		var file_len = this.sgf.length;
		var i = 0;
		var esc_next = false;
		var prop_ident;
		var prop_val;
		var propsFound = [];
		var rex_pos = /^[a-z]{2}$/;

		while (i < file_len) {
			chr = this.sgf[i];
			switch(chr) {
				case "\\":
					esc_next = true;
				break;
				case "(":
					nodes_for_var.push(this.pointer);
				break;
				case ")":
					this.pointer = nodes_for_var.pop();
				break;
				case ";":
					if (!esc_next) {
						// New node
						i += this.sgf_handle_node(this.sgf, i + 1);
					}
				break;
				default:
					if (!/\s/.test(chr)) {
						this.status = SGFPARSER_ST_ERROR;
						this.error = "Unexpected character";
						return false;
					}
				break;
			}
			i++;
		}

		// Result
		if (this.root == null) {
			this.status = SGFPARSER_ST_ERROR;
			this.error = "Empty SGF";
			return false;
		} else {
			this.status = SGFPARSER_ST_PARSED;
			return true;
		}
	},

	sgf_handle_node: function(buffer, buf_start) {
		var prop_end = false;
		var buf_end = buf_start;
		var rex_prop = /^[A-Z]$/
		var prop_ident = "";
		var prop_val = "";
		var prop_arr = [];
		var cur_char = '';
		var esc_next = false;

		this.append_node(new SGFNode());

		while (!prop_end) {
			while (!prop_end) {
				cur_char = buffer[buf_end];
				if (rex_prop.test(cur_char)) {
					prop_ident += cur_char;
				} else if (cur_char == '[') {
					prop_end = true;
				}
				buf_end++;
			}
			prop_end = false;
			while (!prop_end) {
				cur_char = buffer[buf_end];
				if (cur_char == '\\') {
					prop_val += cur_char;
					esc_next = true;
				} else if (!esc_next && cur_char == ']') {
					prop_arr.push(prop_val);
					prop_val = "";
					if (buffer[buf_end + 1] != '[') {
						prop_end = true;
					} else {
						buf_end++;
					}
				} else {
					prop_val += cur_char;
					esc_next = false;
				}
				buf_end++;
			}

			if (prop_arr.length == 1) {
				prop_arr = prop_arr[0];
			}

			this.pointer[prop_ident] = prop_arr;
			prop_arr = [];
			prop_ident = "";
			prop_val = "";
			buf_end += this.sgf_eat_blank(buffer, buf_end);
			if (rex_prop.test(buffer[buf_end])) {
				prop_end = false;
			}
		}
		return buf_end - buf_start;
	},

	sgf_eat_blank: function(buffer, buf_start) {
		var buf_end = buf_start;
		var cur_char = '';
		var end = false;
		while (!end) {
			cur_char = buffer[buf_end];
			switch (cur_char) {
				case '\n':
				break;
				case ' ':
				break;
				case '\\':
					esc_next = true;
				break;
				default:
					end = true;
				break;
			}
			buf_end++;
		}
		return buf_end - buf_start - 1;
	},

	load: function(board) {
		if (this.status == SGFPARSER_ST_PARSED) {
			if (!this.root) {
				return false;
			}

			// Clear the board
			board.clear();

			// Clear moves_loaded
			this.moves_loaded = "";

			// Takes info from the root and configures the board.
			this.process_root_node(board);

			// Fills the tree with the info from the sgf, starting from each node.
			if (!this.sgf_to_tree(board, this.root, board.game_tree.root, NODE_SGF)) {
				if (this.status == SGFPARSER_ST_ERROR) {
					throw new Error(this.error);
				} else {
					throw new Error("Unknown error no 001");
				}
				return false;
			}

			// Go back to the begining.
			this.rewind_game(board);

			board.render();

			board.render_tree();

		} else {
			//throw new Error("Empty / Wrong SGF");
			return false;
		}

		this.status = SGFPARSER_ST_LOADED;
		return true;
	},

	process_root_node: function(board) {
		// Setup based on root node properties.
		var sgf_node = this.root;
		if (sgf_node.RU != undefined) {
			board.change_ruleset(sgf_node.RU);
		}
		if (sgf_node.KM != undefined) {
			board.change_komi(Number(sgf_node.KM));
		}
		if (sgf_node.SZ != undefined) {
			board.change_size(Number(sgf_node.SZ));
		}
		if (sgf_node.TM != undefined) {
			if (sgf_node.OT == undefined) {
				board.setup_timer("Absolute", {"main_time": sgf_node.TM});
			} else {
				// Hello polly from the future, here you can place new time systems...
			}
		}
		if (sgf_node.AB != undefined || sgf_node.AW != undefined) {
			var free = new FreePlay();
			free.captured = {"B": 0, "W": 0};
			board.game_tree.root.play = free;
			if (sgf_node.AB != undefined) {
				sgf_node.AB = [].concat(sgf_node.AB);
				for (var key in sgf_node.AB) {
					free.put.push(new Stone("B", sgf_node.AB[key].charCodeAt(1) - 97, sgf_node.AB[key].charCodeAt(0) - 97));
				}
			}
			if (sgf_node.AW != undefined) {
				sgf_node.AW = [].concat(sgf_node.AW);
				for (var key in sgf_node.AW) {
					free.put.push(new Stone("W", sgf_node.AW[key].charCodeAt(1) - 97, sgf_node.AW[key].charCodeAt(0) - 97));
				}
			}
			board.make_play(free);
			if (board.shower != undefined) {
				board.shower.draw_play(free);
			}
		}
		if (sgf_node.HA != undefined) {
			board.game_tree.root.next_move = "W";
		}
		if (sgf_node.PL != undefined) {
			board.game_tree.root.next_move = sgf_node.PL;
		}
	},

	sgf_to_tree: function(board, sgf_node, tree_node, node_source) {
		// Push roots to start "recursive-like" iteration.
		var pend_sgf_node = [];
		var pend_game_tree_node = [];
		pend_sgf_node.push(sgf_node);
		pend_game_tree_node.push(tree_node)

		var move;
		var time_left;
		var tmp;
		var tree_node;
		while(sgf_node = pend_sgf_node.pop()) {
			tree_node = pend_game_tree_node.pop();
			tree_node.last_next = tree_node.next[0]; // XXX WTF???
		// do: rewind game until reaches board tree_node.
			while (board.game_tree.actual_move != tree_node) {
				tmp = board.game_tree.prev();
				board.undo_play(tmp);
			}
		// do: play sgf_node contents at board point in game.
			// FIXME: quisiera ver cuál es la mejor manera de validar que el sgf hizo la jugada correcta sin tener que confiar en next_move que podría romperse
			if (sgf_node.B != undefined || sgf_node.W != undefined) {
				if (board.get_next_move() == "B" && sgf_node.B != undefined) {
					move = sgf_node.B;
					time_left = sgf_node.BL;
				} else if (board.get_next_move() == "W" && sgf_node.W != undefined) {
					move = sgf_node.W;
					time_left = sgf_node.WL;
				} else {
					this.status = SGFPARSER_ST_ERROR;
					this.error = "Turn and Play mismatch";
					return false;
				}
				if (move == "" || (board.size < 20 && move == "tt")) {
					tmp = new Pass(board.get_next_move())
					board.update_play_captures(tmp);
				} else {
					tmp = board.setup_play(move.charCodeAt(1) - 97, move.charCodeAt(0) - 97);
					if (!tmp) {
						this.status = SGFPARSER_ST_ERROR;
						this.error = "Illegal move or such...";
						return false;
					}
				}
				tmp.time_left = time_left;
				this.moves_loaded += ";" + tmp.put.color + "[" + move + "]";
				board.game_tree.append(new GameNode(tmp, node_source));
				board.make_play(tmp);
				if (time_left != undefined && board.timer != undefined) {
					board.timer.set_remain(board.get_next_move(), time_left);
				}
				if (tmp instanceof Play || tmp instanceof Pass) {
					// TODO: turn count sucks monkey ass
					board.turn_count++;
				}
			}
		// do: push actual_node to pend_game_tree_node
		// do: push sgf_node.next nodes to pend_sgf_node
			for (var key in sgf_node.next) {
				pend_sgf_node.push(sgf_node.next[key]);
				pend_game_tree_node.push(board.game_tree.actual_move);
			}
		}
		return true;
	},

	rewind_game: function(board, limit) {
		var tmp;
		while (board.game_tree.actual_move != board.game_tree.root) {
			tmp = board.game_tree.prev();
			board.undo_play(tmp);
			if (limit != undefined) {
				limit--;
				if (limit <= 0) {
					break;
				}
			}
		}
	},

	add_moves: function(game, sgf, no_rewind) {
		var only_moves = this.parse_only_moves(sgf);
		var only_moves_loaded;
		// Check if the moves we have already loaded are the same that have arrived.
		if (only_moves.length == this.moves_loaded.length) {
			if (only_moves[only_moves.length - 1] == this.moves_loaded[this.moves_loaded.length - 1]) {
				game.confirm_play();
				return true;
			} else {
				throw new Error("Same move count but different plays...");
				return false;
			}
			// Here could be the script that confirms the stone positioning to the last player.
		} else if (only_moves.length > this.moves_loaded.length) {
			// If we have been asked to load more moves than the set that we have already loaded.
			only_moves_loaded = only_moves.substring(0, this.moves_loaded.length);
			only_moves = only_moves.substring(this.moves_loaded.length);
		} else {
			throw new Error("WTF, less info than loaded!");
			return false;
		}
		if (only_moves_loaded != this.moves_loaded) {
			throw new Error("Loaded data mismatch!");
			return false;
		}
		var new_moves_count = only_moves.match(/;/g).length;
		var pos = sgf.length;
		for (var i = 0; i < new_moves_count; ++i) {
			pos = sgf.lastIndexOf(";", pos - 1);
		}
		var new_moves = sgf.substring(pos); // XXX Suposes that the sgf we received ends with a node and not with a ')'

		// Parse new sgf data after last node of the actually parsed sgf tree.
		var tmp_pointer = this.last_node;
		this.pointer = tmp_pointer;
		for (var i = 0, li = new_moves.length; i < li; ++i) {
			i += this.sgf_handle_node(new_moves, i + 1);
		}

		// Move the pointer of the sgf parsed tree to the first of the new parsed moves.
		// XXX if I had variations, this might break (?)
		this.pointer = tmp_pointer.last_next;
		/*
		this.pointer = this.last_node;
		for (i = 1; i < new_moves_count; i++) {
			this.pointer = this.pointer.prev;
		}
		*/

		// Copy the new sgf tree branch to the game tree.
		this.sgf_to_tree(game, this.pointer, game.game_tree.actual_move, NODE_ONLINE);

		// Rewind game so goto_end method can draw it.
		// XXX depending on user focus this could be wrong, maybe the correct is rewind until you reach the user focus.
		// XXX in fact, depending on the focus i might have to rewind before all this loading...

		// XXX Added condition, maybe helps...
		if (!no_rewind) {
			this.rewind_game(game, new_moves_count);
		}

		return true;
	},

	parse_only_moves: function(sgf) {
		var tmp = sgf.match(/;(B|W)\[([a-z]{2})?\]/g);
		if (tmp) {
			return tmp.join("");
		} else {
			return "";
		}
	},

	sgf_to_data: function() {
		var sRes = "";
		if (this.root != null) {
			var prop = "";
			var oNode = this.root;
			var end = false;
			while(!end) {
				for (var e in oNode.properties) {
					prop = oNode.properties[e].prop;
					if (prop == "B" || prop == "W") {
						val = oNode.properties[e].val.toUpperCase();
						sRes += val[0] + "-" + (val.charCodeAt(1) - 65) + ",";
					}
				}
				oNode = oNode.last_next;
				if (oNode == null) {
					end = true;
				}
			}
		}
		return sRes;
	}
}

