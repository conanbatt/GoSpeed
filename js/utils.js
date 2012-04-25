var NODE_SGF = 1;
var NODE_ONLINE = 2;
var NODE_OFFLINE = 4;
var NODE_VARIATION = 8;

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

// Game tree
	function GameTree(div_id_tree) {
		this.root = new GameNode(null);
		this.root.root = true;
		this.root.turn_number = 0;
		this.actual_move = this.root;
		if (div_id_tree != undefined) {
			this.graphic = new GameTreeGraphic(this, div_id_tree);
		}
	}

	GameTree.prototype = {
		append: function(node, follow) {
			node.prev = this.actual_move;
			node.turn_number = this.actual_move.turn_number + 1;
			this.actual_move.next.push(node);
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

		test_path: function(path) {
			var test_node = this.root;
			for (var i = 0, li = path.length; i < li; ++i) {
				if (test_node.next.hasOwnProperty(path[i])) {
					test_node = test_node.next[path[i]];
				} else {
					return false;
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

		toString: function() {
			return this.recRunTree(this.root, "", 0, true);
		},
	}

// Tree shower
	function GameTreeGraphic(game_tree, div_id_tree) {
		if (game_tree == undefined) {
			throw new Error("A tree is needed.");
		}
		this.game_tree = game_tree;
		if (div_id_tree != undefined) {
			this.div_tree = document.getElementById(div_id_tree);
		}
	}

	GameTreeGraphic.prototype = {
		draw: function() {
			this.div_tree.innerHTML = "";
			var max_lvl = 0;
			var node;
			var actual_node_lvl;
			var stash = [];
			stash.push({lvl: 0, elem: this.game_tree.root});
			while(node = stash.pop()) {
				for (var i = node.elem.next.length - 1; i >= 0; --i) {
					stash.push({lvl: (i > 0 ? 1 : 0), elem: node.elem.next[i]});
				}
				max_lvl += node.lvl;
				var div = document.createElement("div");
				if (node.elem.play != undefined && node.elem.play.put != undefined) {
					if (node.elem.play.put.color == "B") {
						div.className = "TreeNode B";
					} else {
						div.className = "TreeNode W";
					}
				} else {
					div.className = "TreeNode";
				}
				div.style.top = (max_lvl * 27 + 5) + "px";
				div.style.left = (node.elem.turn_number * 27 + 5) + "px";
				div.innerHTML = node.elem.turn_number;
				if (node.elem == this.game_tree.actual_move) {
					div.style.backgroundColor = "#ACA";
					actual_node_lvl = max_lvl;
				}
				this.div_tree.appendChild(div);
			}
			this.div_tree.scrollTop = (actual_node_lvl - 2) * 27 + 5;
			this.div_tree.scrollLeft = (this.game_tree.actual_move.turn_number - 5) * 27 + 5;
		}
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

	GameNode.prototype.get_path = function() {
		var pos,
			res = [],
			tmp_node = this;
		while (tmp_node) {
			pos = tmp_node.get_pos();
			if (pos !== false) {
				res.push(pos);
			}
			tmp_node = tmp_node.prev;
		}
		return res.reverse();
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

