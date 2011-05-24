
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

function GameTree() {
	this.first_move = [];
	this.actual_move = null;
	this.last_first = null;
}

GameTree.prototype = {
	append: function(node) {
		if (this.actual_move != null) {
			node.prev = this.actual_move;
			this.actual_move.next.push(node);
			this.actual_move.last_next = node;
		} else {
			this.first_move.push(node);
			this.last_first = node;
		}
		this.actual_move = node;
	},

	next: function() {
		if (this.actual_move == null) {
			this.actual_move = this.last_first;
			return this.actual_move.play;
		} else {
			if (this.actual_move.next.length == 0) {
				return false;
			} else {
				this.actual_move = this.actual_move.last_next;
			}
		}
		return this.actual_move.play;
	},

	prev: function() {
		var tmp_play;
		if (this.actual_move == null) {
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
		var i, s, x;
		if (arbol.next.length == 0) {
			return cadena += (this.actual_move == arbol ? '<span style="' + (sel ? "color: #000;" : "color: #888;") + '"><span style="text-decoration: underline;">' + nivel + '</span> - </span>' : '<span style="' + (sel ? "color: #000;" : "color: #888;") + '">' + nivel + ' - </span>');
		} else {
			s = "";
			x = "";
			for (var i = 0; i < nivel; i++) {
				s += "&nbsp;&nbsp;&nbsp;&nbsp;";
			}
			s += "&bull;&nbsp;-&nbsp;";
			x += this.recRunTree(arbol.next[0], cadena + (this.actual_move == arbol ? '<span style="' + (sel ? "color: #000;" : "color: #888;") + '"><span style="text-decoration: underline;">' + nivel + '</span> - </span>' : '<span style="' + (sel ? "color: #000;" : "color: #888;") + '">' + nivel + ' - </span>'), nivel + 1, sel && (arbol.last_next == arbol.next[0]))
			for (var i = 1; i < arbol.next.length; i++) {
				x += "<br />" + s + this.recRunTree(arbol.next[i], "", nivel + 1, sel && (arbol.last_next == arbol.next[i]));
			}
			return x;
		}
	},

	toString: function() {
		var n = new GameNode(null);
		for (node in this.first_move) {
			n.next.push(this.first_move[node]);
		}
		n.last_next = n.next[0];
		return this.recRunTree(n, "", 0, true);
	},
}

function GameNode(play) {
	this.play = play;
	this.prev = null;
	this.next = [];
	this.last_next = null;
}

