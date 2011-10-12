
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

// Game tree
	function GameTree() {
		this.root = new GameNode(null);
		this.actual_move = this.root;
	}

	GameTree.prototype = {
		append: function(node) {
			node.prev = this.actual_move;
			this.actual_move.next.push(node);
			this.actual_move.last_next = node;
			this.actual_move = node;
		},

		next: function() {
			if (this.actual_move.next.length == 0) {
				return false;
			} else {
				this.actual_move = this.actual_move.last_next;
			}
			return this.actual_move.play;
		},

		prev: function() {
			var tmp_play;
			if (this.actual_move.play == null || this.actual_move.prev == null) {
				return false;
			} else {
				tmp_play = this.actual_move.play;
				this.actual_move = this.actual_move.prev;
				return tmp_play;
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
				return cadena += (this.actual_move == arbol ? '<span style="' + (sel ? "color: #000;" : "color: #888;") + '"><span style="text-decoration: underline;">' + (arbol.play instanceof FreePlay ? "F!" : completarAncho(nivel)) + '</span> - </span>' : '<span style="' + (sel ? "color: #000;" : "color: #888;") + '">' + (arbol.play instanceof FreePlay ? "F!" : completarAncho(nivel)) + ' - </span>');
			} else {
				s = "";
				x = "";
				for (var i = 0; i < nivel; i++) {
					s += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
				}
				s += "&nbsp;&nbsp;&bull;&nbsp;-&nbsp;";
				x += this.recRunTree(arbol.next[0], cadena + (this.actual_move == arbol ? '<span style="' + (sel ? "color: #000;" : "color: #888;") + '"><span style="text-decoration: underline;">' + (arbol.play instanceof FreePlay ? "F!" : completarAncho(nivel)) + '</span> - </span>' : '<span style="' + (sel ? "color: #000;" : "color: #888;") + '">' + (arbol.play instanceof FreePlay ? "F!" : completarAncho(nivel)) + ' - </span>'), nivel + 1, sel && (arbol.last_next == arbol.next[0]))
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

// Game node
	function GameNode(play) {
		this.play = play;
		this.prev = null;
		this.next = [];
		this.last_next = null;
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

