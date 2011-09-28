
function Stone(color, row, col) {
	this.init.call(this, color, row, col);
}

Stone.prototype = {
	init: function(color, row, col) {
		if (color != "W" && color != "B") {
			throw new Error("El color debe ser 'B' o 'W'.");
		}
		this.color = color;
		this.row = row;
		this.col = col;
	},

	toString: function() {
		return this.color + ": (" + this.row + ", " + this.col + ")";
	},

	equals: function(that) {
		for (var item in this) {
			if (this[item] != that[item]) {
				return false;
			}
		}
		return true;
	},

	compareTo: function(a, b) {
		if (b.row != a.row) {
			return b.row - a.row;
		} else {
			return b.col - a.col;
		}
	},
};

Stone.compair = function(a, b) {
	return a.compareTo(b);
};

