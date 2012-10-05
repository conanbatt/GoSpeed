var NODE_SGF = 1;
var NODE_ONLINE = 2;
var NODE_OFFLINE = 4;
var NODE_VARIATION = 8;
var TREE_DRAW_INTERVAL = 100;

// Play
	function Play(color, row, col) {
		this.put = new Stone(color, row, col);
		this.remove = [];
	}

	Play.prototype = {
		toString: function() {
			var s = "Play:\n\t";
			s += "Put: " + this.put + "\n\t";
			s += "Remove(" + this.remove.length + ") {";
			for (stone in this.remove) {
				s += "\n\t\t" + this.remove[stone] + ",";
			}
			s += "\n\t}";
			return s;
		},

		softEqual: function(play) {
			return (
				play instanceof Play &&
				play.put.equals(this.put)
			);
		},

		hardEqual: function(play) {
			var res = play instanceof Play;
			if (res) {
				for (var item in this) {
					if (item == "put") {
						if (!this[item].equals(play[item])) {
							res = false;
							break;
						}
					} else {
						if (this[item] != play[item]) {
							res = false;
							break;
						}
					}
				}
			}
			return res;
		},
	}

// Free play
	function FreePlay() {
		this.put = [];
		this.remove = [];
	}

	FreePlay.prototype = {
		toString: function() {
			var s = "Play:\n\t";
			s += "Put(" + this.put.length + ") {";
			for (stone in this.put) {
				s += "\n\t\t" + this.put[stone] + ",";
			}
			s += "\n\t}\n";
			s += "Remove(" + this.remove.length + ") {";
			for (stone in this.remove) {
				s += "\n\t\t" + this.remove[stone] + ",";
			}
			s += "\n\t}";
			return s;
		},

		get_put_by_pos: function(row, col) {
			for (stone in this.put) {
				if (this.put[stone].row == row && this.put[stone].col == col) {
					return [stone, this.put[stone]];
				}
			}
			return false;
		},

		get_rem_by_pos: function(row, col) {
			for (stone in this.remove) {
				if (this.remove[stone].row == row && this.remove[stone].col == col) {
					return [stone, this.remove[stone]];
				}
			}
			return false;
		},

		clean_pos: function(row, col) {
			var i;
			i = 0;
			while (i < this.put.length) {
				if (this.put[i].row == row && this.put[i].col == col) {
					this.put.splice(i, 1);
				} else {
					i++;
				}
			}
			i = 0;
			while (i < this.remove.length) {
				if (this.remove[i].row == row && this.remove[i].col == col) {
					this.remove.splice(i, 1);
				} else {
					i++;
				}
			}
		}
	}

// Pass
	function Pass(color) {
		if (color == "W" || color == "B") {
			this.put = {"color": color};
			this.remove = [];
		} else {
			throw new Error("Pass requires a color.");
		}
	}

	Pass.prototype.softEqual = function(play) {
		return (
			play instanceof Pass &&
			play.put.color == this.put.color
		);
	};

// Game tree
	function GameTree(div_id_tree, goto_method) {
		this.root = new GameNode(null);
		this.root.root = true;
		this.root.pos = false;
		this.root.turn_number = 0;
		this.actual_move = this.root;

		// Graphics
		this.goto_method = goto_method;
		this.init_graphics(div_id_tree);
	}

	GameTree.prototype = {
		append: function(node, follow) {
			node.prev = this.actual_move;
			node.turn_number = this.actual_move.turn_number + 1;
			this.actual_move.next.push(node);
			node.pos = this.actual_move.next.length - 1;

			// TODO XXX FIXME: here might be the origin of the govar bug.
			if (follow) {
				this.actual_move.last_next = node;
			} else {
				var l_next = null;
				if (this.actual_move.source == NODE_VARIATION) {
					l_next = node;
				} else {
					for (var i = 0, li = this.actual_move.next.length; i < li; ++i) {
						if (this.actual_move.next[i].source != NODE_VARIATION) {
							l_next = this.actual_move.next[i];
							break;
						}
					}
				}
				this.actual_move.last_next = l_next;
			}
			this.actual_move = node;
		},

		next: function(index) {
			var next = this.actual_move.next;
			if (next.length == 0) {
				return false;
			} else {
				if (next[index] != undefined) {
					this.actual_move.last_next = next[index];
					this.actual_move = next[index];
				} else {
					if (this.actual_move.last_next != undefined) {
						this.actual_move = this.actual_move.last_next;
					} else {
						return false;
					}
				}
			}
			return this.actual_move;
		},

		prev: function() {
			var tmp_node;
			if (this.actual_move.play == null || this.actual_move.prev == null) {
				return false;
			} else {
				tmp_node = this.actual_move;
				this.actual_move = this.actual_move.prev;
				return tmp_node;
			}
		},

		up: function() {
			var x;
			if (this.actual_move != null) {
				if (this.actual_move.next.length > 1) {
					x = this.actual_move.next.indexOf(this.actual_move.last_next);
					if (x > 0) {
						this.actual_move.last_next = this.actual_move.next[x - 1];
					}
				}
			}
		},

		down: function() {
			var x;
			if (this.actual_move != null) {
				if (this.actual_move.next.length > 1) {
					x = this.actual_move.next.indexOf(this.actual_move.last_next);
					if (x < this.actual_move.next.length - 1) {
						this.actual_move.last_next = this.actual_move.next[x + 1];
					}
				}
			}
		},

		render_tree: function() {
			if (this.graphic != undefined) {
				this.graphic.draw();
			}
		},

		test_path: function(arr_path) {
			var pos; // Decition to make
			var count; // Number of times
			var test_node = this.root; // Pointer
			if (arr_path[0][0] != "root") {
				for (var i = 0, li = arr_path.length; i < li; ++i) {
					pos = Number(arr_path[i][0]);
					if (arr_path[i][1] != undefined) {
						count = Number(arr_path[i][1]);
					} else {
						count = 1;
					}
					// Browse tree
					while(count--) {
						if (test_node.next.hasOwnProperty(pos)) {
							test_node = test_node.next[pos];
						} else {
							return false;
						}
					}
				}
			}
			return true;
		},

		recRunTree: function(arbol, cadena, nivel, sel) {
			function completarAncho(nivel) {
				if (nivel < 10) {
					return "&nbsp;&nbsp;" + nivel;
				} else if (nivel < 100) {
					return "&nbsp;" + nivel;
				} else {
					return nivel;
				}
			}
			var i, s, x;
			if (arbol.next.length == 0) {
				return cadena += (this.actual_move == arbol ? '<span style="' + (sel ? "color: #000;" : "color: #888;") + '"><span style="text-decoration: underline;">' + (arbol.play instanceof FreePlay ? "&nbsp;F!" : completarAncho(nivel)) + '</span> - </span>' : '<span style="' + (sel ? "color: #000;" : "color: #888;") + '">' + (arbol.play instanceof FreePlay ? "&nbsp;F!" : completarAncho(nivel)) + ' - </span>');
			} else {
				s = "";
				x = "";
				for (var i = 0; i < nivel; i++) {
					s += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
				}
				s += "&nbsp;&nbsp;&bull;&nbsp;-&nbsp;";
				x += this.recRunTree(arbol.next[0], cadena + (this.actual_move == arbol ? '<span style="' + (sel ? "color: #000;" : "color: #888;") + '"><span style="text-decoration: underline;">' + (arbol.play instanceof FreePlay ? "&nbsp;F!" : completarAncho(nivel)) + '</span> - </span>' : '<span style="' + (sel ? "color: #000;" : "color: #888;") + '">' + (arbol.play instanceof FreePlay ? "&nbsp;F!" : completarAncho(nivel)) + ' - </span>'), nivel + 1, sel && (arbol.last_next == arbol.next[0]))
				for (var i = 1; i < arbol.next.length; i++) {
					x += "<br />" + s + this.recRunTree(arbol.next[i], "", nivel + 1, sel && (arbol.last_next == arbol.next[i]));
				}
				return x;
			}
		},

		/*
		toString: function() {
			return this.recRunTree(this.root, "", 0, true);
		},
		*/

		init_graphics: function(div_id_tree) {
			if (div_id_tree != undefined) {
				this.graphic = new GameTreeGraphic(this, div_id_tree, this.goto_method);
			}
		},
	}

// Tree shower
	function GameTreeGraphic(game_tree, div_id_tree, goto_method) {
		if (game_tree == undefined) {
			throw new Error("A tree is needed.");
		}
		this.game_tree = game_tree;
		if (div_id_tree != undefined) {
			this.div_tree = document.getElementById(div_id_tree);
		}
		if (typeof goto_method === "function") {
			this.goto_method = goto_method;
		}
		this.ready_to_draw = true;
		this.draw_requested = false;
	}

	GameTreeGraphic.prototype = {
		draw: function() {
			// Performance timer
			if (!this.ready_to_draw) {
				this.draw_requested = true;
				return false;
			} else {
				this.draw_requested = false;
				this.ready_to_draw = false;
			}

			var that = this;
			function branch_concurrence(b1, b2) {
				var codo = (b2.pos == 0 ? 0 : 1);
				if (b1.x >= b2.x - codo && b1.x <= b2.x + b2.width) {
					return true;
				}
				if (b1.x <= b2.x - codo && b1.x + b1.width - 1 >= b2.x - codo) {
					return true;
				}
				return false;
			}
			function correct_whole_branch(branch) {
				var cur_branch = branch;
				cur_branch.lvl++;
				while (cur_branch.pos == 0 && cur_branch.parent_branch.lvl < cur_branch.lvl) {
					cur_branch.parent_branch.lvl = cur_branch.lvl;
					cur_branch = cur_branch.parent_branch;
				}
			}
			function add_node(node, branch, first) {
				if (first && node.pos > 0) {
					var elbow = document.createElement("div");
					elbow.className = "Elbow";
					if (branch.selected) {
						elbow.className += " Selected";
					}
					if (branch.source >= NODE_OFFLINE) {
						elbow.className += " Variation";
					}
					elbow.style.top = (branch.lvl * 27 + 5) + "px";
					elbow.style.left = ((node.turn_number - 1) * 27 + 5) + "px";
					that.div_tree.appendChild(elbow);
					var height = 0;
					for (var i = branch.parent_branch.lvl + 1, li = branch.lvl - 1; i <= li; ++i) {
						height += 27;
					}
					if (height > 0) {
						var vline = document.createElement("div");
						vline.className = "VLine";
						if (branch.selected) {
							vline.className += " Selected";
						}
						if (branch.source >= NODE_OFFLINE) {
							vline.className += " Variation";
						}
						vline.style.top = ((branch.parent_branch.lvl + 1) * 27 + 5) + "px";
						vline.style.left = ((node.turn_number - 1) * 27 + 5) + "px";
						vline.style.height = height + "px";
						that.div_tree.appendChild(vline);
					}
				}
				var div = document.createElement("a");
				div.href = "javascript: void(0);";
				div.className = "TreeNode";
				if (node.play != undefined && node.play.put != undefined) {
					div.className += " " + node.play.put.color;
				}
				if (branch.selected) {
					div.className += " Selected";
				}
				div.style.top = (branch.lvl * 27 + 5) + "px";
				div.style.left = (node.turn_number * 27 + 5) + "px";
				div.innerHTML = node.turn_number;
				if (node == that.game_tree.actual_move) {
					div.className += " Current";
				}
				if (node.source >= NODE_OFFLINE) {
					div.className += " Variation";
				}
				if (that.goto_method != undefined) {
					div.onclick = that.binder(function(event) {
						event.preventDefault();
						that.goto_method(node.get_path(), node.source);
					});
				}
				that.div_tree.appendChild(div);
			}

			this.div_tree.innerHTML = "";
			var node;
			var fixed;
			var width = 0;
			var stash = [];
			var branches = [];
			var cur_branch;
			var actual_node_lvl;
			stash.push({lvl: 0, elem: this.game_tree.root, selected: true});
			while(node = stash.pop()) {
				// First collect info about actual branch
				width = 0;
				cur_branch = {x: node.elem.turn_number, pos: node.elem.pos, lvl: node.lvl, parent_branch: node.parent_branch, source: node.elem.source};
				if (node.elem.prev == undefined || node.selected && node.elem.prev.last_next == node.elem) {
					cur_branch.selected = true;
				}
				while(node) {
					width++;
					if (node.elem.next.length > 1) {
						for (var i = node.elem.next.length - 1; i >= 0; --i) {
							stash.push({lvl: node.lvl + i, elem: node.elem.next[i], selected: cur_branch.selected, parent_branch: cur_branch});
						}
						node = false;
					} else {
						if (node.elem.next.length == 0) {
							node = false;
						} else {
							node = {lvl: node.lvl, elem: node.elem.next[0], selected: node.selected, parent_branch: node.parent_branch};
						}
					}
				}
				cur_branch.width = width;

				// Now compare with previous branches and check if there's need to adjust lvl
				fixed = false;
				while(!fixed) {
					// Correct cur if parent was corrected
					if (cur_branch.parent_branch && cur_branch.lvl < cur_branch.parent_branch.lvl + cur_branch.pos) {
						cur_branch.lvl = cur_branch.parent_branch.lvl + cur_branch.pos;
					}
					for (var i = 0, li = branches.length; i < li; ++i) {
						if (branches[i].lvl >= cur_branch.lvl) {
							if (branch_concurrence(branches[i], cur_branch)) {
								correct_whole_branch(cur_branch);
								fixed = true;
							}
						}
					}
					// Check again...
					fixed = !fixed;
				}
				branches.push(cur_branch);
			}

			//console.log(branches);
			// assertion...
			if (stash.length > 0) {
				throw new Error("Wha?!");
			}

			var first;
			stash.push(this.game_tree.root);
			while(node = stash.pop()) {
				cur_branch = branches.shift();
				first = true;
				while(node) {
					add_node(node, cur_branch, first);
					first = false;
					if (node === this.game_tree.actual_move) {
						actual_node_lvl = cur_branch.lvl;
					}
					if (node.next.length > 1) {
						for (var i = node.next.length - 1; i >= 0; --i) {
							stash.push(node.next[i]);
						}
						node = false;
					} else {
						if (node.next.length == 0) {
							node = false;
						} else {
							node = node.next[0];
						}
					}
				}
			}

			this.div_tree.scrollTop = (actual_node_lvl - 2) * 27 + 5;
			this.div_tree.scrollLeft = (this.game_tree.actual_move.turn_number - 5) * 27 + 5;

			// Performance timer
			window.setTimeout(function() {
				that.ready_to_draw = true;
				if (that.draw_requested) {
					that.draw();
				}
			}, TREE_DRAW_INTERVAL);
		},

		binder: function (method, object, args) {
			return function(orig_args) { method.apply(object, [orig_args].concat(args)); };
		},
	};

// Game node
	function GameNode(play, source, comments) {
		this.play = play;
		this.prev = null;
		this.next = [];
		this.last_next = undefined;
		this.source = source;
		this.comments = comments;
	}

	GameNode.prototype.get_pos = function() {
		if (this.prev) {
			var siblings = this.prev.next;
			for (var i = 0, li = siblings.length; i < li; i++) {
				if (siblings[i] === this) {
					return i;
				}
			}
		}
		return false;
	}

	GameNode.prototype.search_next_play = function(play) {
		var index = false;
		for (var i = 0, li = this.next.length; i < li; ++i) {
			if (play.softEqual(this.next[i].play)) {
				index = i;
				break;
			}
		}
		return index;
	}

	GameNode.prototype.get_path = function() {
		// Erm... root node...
		if (this.root === true) {
			return "root";
		}

		// Else, make path
		var res = []; // Stores the result as an array
		var last_pos; // The last decition made
		var pos_count = 0; // The number of times the decition was repeated
		var tmp_node = this; // Pointer
		while (tmp_node) {
			if (typeof tmp_node.pos === "number") {
				if (last_pos == tmp_node.pos) {
					// Same decition? increment
					pos_count++;
				} else {
					if (typeof last_pos === "number") {
						// Changed decition? store previous one
						if (pos_count > 1) {
							res.unshift(last_pos + "-" + pos_count);
						} else {
							res.unshift(last_pos + "");
						}
					}
					// And configure for the new one
					last_pos = tmp_node.pos;
					pos_count = 1;
				}
			}
			// Go one node back
			tmp_node = tmp_node.prev;
		}
		// Store last decition taken
		if (typeof last_pos === "number") {
			if (pos_count > 1) {
				res.unshift(last_pos + "-" + pos_count);
			} else {
				res.unshift(last_pos + "");
			}
		}

		// Encode and return
		return res.join("|");
	}

// Track
	function Track(grid, head) {
		this.grid = grid;
		this.head = head;
	}

// Helper functions
	// inArray: returns true if the needle is an element into the haystack
		function inArray(needle, haystack) {
			var length = haystack.length;
			for(var i = 0; i < length; i++) {
				if(haystack[i] == needle) return true;
			}
			return false;
		}

	// inArrayDeep: returns true if the needle is an element into the haystack (with deep comparison)
		function inArrayDeep(needle, haystack) {
			var length = haystack.length;
			var res = true;
			for (var i = 0; i < length; i++) {
				if (haystack[i].length != needle.length) {
					continue;
				}
				for (var j in needle) {
					if (haystack[i][j] != needle[j]) {
						res = false;
						break;
					} else {
						continue;
					}
				}
				if (res) {
					return true;
				} else {
					res = true;
				}
			}
			return false;
		}

		function binder(method, object, args) {
			var binded_function = function() {
				var tmp_arr = new Array();
				for (var i = 0, li = arguments.length; i < li; ++i) {
					tmp_arr.push(arguments[i]);
				}
				if (args != undefined) {
					for (var i = 0, li = args.length; i < li; ++i) {
						tmp_arr.push(args[i]);
					}
				}
				method.apply(object, tmp_arr);
			};
			return binded_function;
		}
