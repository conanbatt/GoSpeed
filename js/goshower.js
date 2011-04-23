
function GoShower(game, div_id) {
	this.init.call(this, game, div_id);
}

GoShower.prototype = {
	init: function(game, div_id) {
		this.game = game;
		this.div = document.getElementById(div_id);
	},

	put_stone: function(color, row, col) {
		var node = this.div.getElementsByTagName("span")[parseInt(row, 10) * this.game.size + parseInt(col, 10)];
		node.className = "Stone" + color;
		node.innerHTML = "O";
		//node.onclick = function() {};
	},

	place_ko: function(ko) {
		var node = this.div.getElementsByTagName("span")[parseInt(ko.row, 10) * this.game.size + parseInt(ko.col, 10)];
		node.innerHTML = "X"
	},

	clear_ko: function(ko) {
		var node = this.div.getElementsByTagName("span")[parseInt(ko.row, 10) * this.game.size + parseInt(ko.col, 10)];
		node.innerHTML = this.get_background_char(ko.row, ko.col);
	},

	remove_stone: function(row, col) {
		var node = this.div.getElementsByTagName("span")[parseInt(row, 10) * this.game.size + parseInt(col, 10)];
		node.className = "Node";
		node.innerHTML = this.get_background_char(row, col);

		var args = [parseInt(node.getAttribute("r"), 10), parseInt(node.getAttribute("c"), 10)];
		node.onclick = this.binder(this.game.play, this.game, args);
	},

	get_background_char: function(row, col) {
		var chr;
		if (this.game.ko != undefined && this.game.ko.row == row && this.game.ko.col == col) {
			chr = 'X';
		} else {
			if (row == 0 || col == 0 || row == this.game.size-1 || col == this.game.size-1) {
				chr = '·';
			} else {
				if (this.game.size == 9) {
					if (row % 2 == 0 && col % 2 == 0 && (row + col) % 2 == 0) {
						chr = '·';
					} else {
						chr = '+';
					}
				} else if (this.game.size == 13) {
					if (row % 3 == 0 && col % 3 == 0 && (row + col) % 3 == 0) {
						chr = '·';
					} else {
						chr = '+';
					}
				} else if (this.game.size == 19) {
					if (row % 6 == 3 && col % 6 == 3 && (row + col) % 6 == 0) {
						chr = '·';
					} else {
						chr = '+';
					}
				}
			}
		}
		return chr;
	},

	toString: function() {
		var s = "";
		var rows = this.game.size;
		var cols = this.game.size;
		for (i = 0 ; i < rows ; i++) {
			for (j = 0 ; j < cols ; j++) {
				if (this.game.grid[i][j] == undefined) {
					s += '<span class="Node" r="' + i + '" c="' + j + '">' + this.get_background_char(i, j) + '</span> ';
				} else {
					s += '<span class="Stone' + this.game.grid[i][j] + '">' + (this.game.grid[i][j] == "B" ? "O" : "O") + '</span>' + " ";
				}
				if (j == this.game.size-1) {
					s += "<br />";
				}
			}
		}
		return s;
	},

	binder: function (method, object, args) {
		return function() { method.apply(object, args); };
	},

	render: function() {
		this.div.innerHTML = this.toString();
		var nodes = this.div.getElementsByTagName("span");
		for (node in nodes) {
			if (nodes[node].className == "Node") {
				var args = [parseInt(nodes[node].getAttribute("r"), 10), parseInt(nodes[node].getAttribute("c"), 10)];
				nodes[node].onclick = this.binder(this.game.play, this.game, args);
			}
		}
	},

};
