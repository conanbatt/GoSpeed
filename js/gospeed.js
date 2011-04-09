
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
	},

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
		}
	},

	show_info: function() {
		alert("Size: " + this.size + "\nMode: " + this.mode + "\nRuleset: " + this.ruleset);
	},

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

	get_pos: function(row, col) {
		if (row >= this.size || col >= this.size) {
			throw new Error("Position out of board");
		}
		return this.grid[row][col];
	},

	toString: function() {
		var s = "";
		var rows = this.grid.length;
		var cols;
		for (i = 0 ; i < rows ; i++) {
			cols = this.grid[i].length;
			for (j = 0 ; j < cols ; j++) {
				if (this.grid[i][j] == undefined) {
					if (i == 0 || j == 0 || i == this.size-1 || j == this.size-1) {
						s += '<span class="Node" r="' + i + '" c="' + j + '">·</span> ';
					} else {
						if (this.size == 9) {
							if (i % 2 == 0 && j % 2 == 0 && (i + j) % 2 == 0) {
								s += '<span class="Node" r="' + i + '" c="' + j + '">·</span> ';
							} else {
								s += '<span class="Node" r="' + i + '" c="' + j + '">+</span> ';
							}
						} else if (this.size == 13) {
							if (i % 3 == 0 && j % 3 == 0 && (i + j) % 3 == 0) {
								s += '<span class="Node" r="' + i + '" c="' + j + '">·</span> ';
							} else {
								s += '<span class="Node" r="' + i + '" c="' + j + '">+</span> ';
							}
						} else if (this.size == 19) {
							if (i % 6 == 3 && j % 6 == 3 && (i + j) % 6 == 0) {
								s += '<span class="Node" r="' + i + '" c="' + j + '">·</span> ';
							} else {
								s += '<span class="Node" r="' + i + '" c="' + j + '">+</span> ';
							}
						}
					}
				} else {
					s += '<span class="Stone' + this.grid[i][j] + '">' + (this.grid[i][j] == "B" ? "O" : "O") + '</span>' + " ";
				}
				if (j == this.size-1) {
					s += "<br />";
				}
			}
		}
		return s;
	},

	play: function(node, row, col) {
		this.put_stone(this.next_move, row, col);

		// Render
			node.className = "Stone" + this.next_move;
			node.innerHTML = "O";
			node.onclick = function() {};
		// --->

		this.next_move = (this.next_move == "W" ? "B" : "W");
	},

	binder: function (method, object, args) {
		return function() { method.apply(object, args); };
	},

	render: function() {
		var divs = document.getElementsByTagName("div");
		for (div in divs) {
			if (divs[div].className == "gospeed-board") {
				divs[div].innerHTML = this.toString();
				var nodes = divs[div].getElementsByTagName("span");
				for (node in nodes) {
					if (nodes[node].className == "Node") {
						var args = [nodes[node], nodes[node].getAttribute("r"), nodes[node].getAttribute("c")];
						nodes[node].onclick = this.binder(this.play, this, args);
					}
				}
			}
		}
	},
}

