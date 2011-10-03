var STONE_SIZE = 25;
var BOARD_BOUND = 10;
var SHADOW_DISTANCE = 2;

function GoGraphic(game) {
	this.init.call(this, game);
}

GoGraphic.prototype = {
	init: function(game) {
		this.game = game;
		this.validate_and_load_divs();
		this.grid = Array(this.game.size);
		for (var row = 0 ; row < this.game.size ; row++) {
			this.grid[row] = Array(this.game.size);
		}
		this.max_bound = this.game.size * STONE_SIZE + BOARD_BOUND;
	},

	put_stone: function(color, row, col) {
		var stone = document.createElement("div");
		var stoneLeft = col * STONE_SIZE + BOARD_BOUND;
		var stoneTop = row * STONE_SIZE + BOARD_BOUND;
		stone.className = "Stone" + color;
		stone.style.left = stoneLeft + "px";
		stone.style.top = stoneTop + "px";
		this.div_board.appendChild(stone);

		var shadow = document.createElement("div");
		shadow.className = "Shadow";
		shadow.style.left = (stoneLeft + SHADOW_DISTANCE) + "px";
		shadow.style.top = (stoneTop + SHADOW_DISTANCE) + "px";
		this.div_board.appendChild(shadow);

		this.clean_t_stones();
		this.grid[row][col] = [stone, shadow];
	},

	place_ko: function(ko) {
		this.ko.style.left = (ko.col * STONE_SIZE + BOARD_BOUND) + "px";
		this.ko.style.top = (ko.row * STONE_SIZE + BOARD_BOUND) + "px";
		this.ko.style.display = "block";
	},

	clear_ko: function() {
		this.ko.style.display = "none";
	},

	refresh_ko: function(play) {
		if (play.ko) {
			this.place_ko(play.ko);
		} else {
			this.clear_ko();
		}
	},

	remove_stone: function(row, col) {
		if (this.grid[row][col] != null) {
			this.div_board.removeChild(this.grid[row][col][0]);
			this.div_board.removeChild(this.grid[row][col][1]);
		}
	},

	draw_play: function(play) {
		if (play instanceof FreePlay) {
			for (var stone in play.remove) {
				this.remove_stone(play.remove[stone].row, play.remove[stone].col);
			}
			for (var stone in play.put) {
				this.put_stone(play.put[stone].color, play.put[stone].row, play.put[stone].col);
			}
		} else {
			this.put_stone(play.put.color, play.put.row, play.put.col);
			for (var stone in play.remove) {
				this.remove_stone(play.remove[stone].row, play.remove[stone].col);
			}
			this.refresh_ko(play);
		}
	},

	undraw_play: function(play) {
		if (play instanceof FreePlay) {
			for (var stone in play.put) {
				this.remove_stone(play.put[stone].row, play.put[stone].col);
			}
			for (var stone in play.remove) {
				this.put_stone(play.remove[stone].color, play.remove[stone].row, play.remove[stone].col);
			}
		} else {
			this.remove_stone(play.put.row, play.put.col);
			for (var stone in play.remove) {
				this.put_stone(play.remove[stone].color, play.remove[stone].row, play.remove[stone].col);
			}
		}
	},

	binder: function (method, object, args) {
		return function(orig_args) { method.apply(object, [orig_args].concat(args)); };
	},

	click_handler: function(click) {
		var boundedX = click.pageX - this.div_board.offsetLeft + 1;
		var boundedY = click.pageY - this.div_board.offsetTop + 1;
		if (boundedX > BOARD_BOUND && boundedX < this.max_bound && boundedY > BOARD_BOUND && boundedY < this.max_bound) {
			var gridX = parseInt((boundedX - BOARD_BOUND) / STONE_SIZE, 10);
			var gridY = parseInt((boundedY - BOARD_BOUND) / STONE_SIZE, 10);
			this.game.play(gridY, gridX);
		}
	},

	mousemove_handler: function(mouse) {
		var t_stone;
		switch (this.game.mode) {
			case "free":
				t_stone = this.t_white;
			break;
			case "play":
				if (this.game.next_move == "B") {
					t_stone = this.t_black;
				} else {
					t_stone = this.t_white;
				}
			break;
			case "play_online":
				if (this.game.is_my_turn()) {
					if (this.game.my_colour == "B") {
						t_stone = this.t_black;
					} else {
						t_stone = this.t_white;
					}
				} else {
					t_stone = null;
				}
			case "count":
			break;
		}


		if (t_stone == null) {
			this.t_black.style.display = "none";
			this.t_white.style.display = "none";
			return false;
		}

		var boundedX = mouse.pageX - this.div_board.offsetLeft + 1;
		var boundedY = mouse.pageY - this.div_board.offsetTop + 1;
		if (boundedX <= BOARD_BOUND || boundedX >= this.max_bound || boundedY <= BOARD_BOUND || boundedY >= this.max_bound) {
			t_stone.style.display = "none";
			return false;
		}

		var col = parseInt((boundedX - BOARD_BOUND) / STONE_SIZE, 10);
		var row = parseInt((boundedY - BOARD_BOUND) / STONE_SIZE, 10);

		if (this.game.get_pos(row, col) != undefined) {
			t_stone.style.display = "none";
			return false;
		}

		if (this.game.pos_is_ko(row, col)) {
			t_stone.style.display = "none";
			return false;
		}

		var tmp_play = new Play(this.game.next_move, row, col);
		this.game.play_eat(tmp_play);
		if (this.game.play_check_suicide(tmp_play)) {
			t_stone.style.display = "none";
			return false;
		}

		t_stone.style.left = (col * STONE_SIZE + BOARD_BOUND) + "px";
		t_stone.style.top = (row * STONE_SIZE + BOARD_BOUND) + "px";
		t_stone.style.display = "block";

	},

	mouseout_handler: function(mouse) {
		var hide = false;
		if (mouse.relatedTarget == null) {
			this.clean_t_stones();
		} else {
			if (mouse.relatedTarget == this.div_board) {
				return;
			}
			if (mouse.relatedTarget.parentNode != this.div_board) {
				this.clean_t_stones();
			}
		}
	},

	update_clocks: function(remain) {
		function formatTime(seconds) {
			var tmp_min;
			var tmp_sec;
			if (seconds > 0) {
				tmp_min = Math.floor(seconds / 60);
				tmp_sec = Math.floor(seconds - tmp_min * 60);
				if (tmp_min < 10) {
					tmp_min = "0" + tmp_min;
				}
				if (tmp_sec < 10) {
					tmp_sec = "0" + tmp_sec;
				}
			} else {
				tmp_min = "00";
				tmp_sec = "00";
			}
			return tmp_min + ":" + tmp_sec;
		}

		this.div_clock_w.innerHTML = formatTime(remain["W"]);
		this.div_clock_b.innerHTML = formatTime(remain["B"]);
	},

	render: function() {
		switch(this.game.size) {
			case 19:
				this.div_board.style.width = "495px";
				this.div_board.style.height = "495px";
				this.div_board.className = "OnlyBoard19";
				//this.div_board.style.backgroundImage = "url(img/OnlyBoard19.png)";
			break;
			case 13:
				this.div_board.style.width = "346px";
				this.div_board.style.height = "346px";
				this.div_board.className = "OnlyBoard13";
				//this.div_board.style.backgroundImage = "url(img/OnlyBoard13.png)";
			break;
			case 9:
				this.div_board.style.width = "246px";
				this.div_board.style.height = "246px";
				this.div_board.className = "OnlyBoard9";
				//this.div_board.style.backgroundImage = "url(img/OnlyBoard9.png)";
			break;
		}
		this.div_board.style.position = "relative";

		// Image prefetch (dunno if this is the right place...)
		var tmp_path = "";
		if (this.game.server_path_gospeed_root != undefined) {
			tmp_path = this.game.server_path_gospeed_root;
		}
		(new Image()).src = tmp_path + "img/white.png";
		(new Image()).src = tmp_path + "img/black.png";
		(new Image()).src = tmp_path + "img/t_white.png";
		(new Image()).src = tmp_path + "img/t_black.png";
		(new Image()).src = tmp_path + "img/shadow.png";

		// Transparent Stones
		var t_white = document.createElement("div");
		t_white.className = "StoneTW";
		this.div_board.appendChild(t_white);
		t_white.style.display = "none";
		this.t_white = t_white;
		var t_black = document.createElement("div");
		t_black.className = "StoneTB";
		this.div_board.appendChild(t_black);
		t_black.style.display = "none";
		this.t_black= t_black;

		// Ko
		var ko = document.createElement("div");
		ko.className = "Ko";
		this.div_board.appendChild(ko);
		this.ko = ko;

		// Bind mouse handlers
		this.div_board.onclick = this.binder(this.click_handler, this, null);
		this.div_board.onmousemove = this.binder(this.mousemove_handler, this, null);
		this.div_board.onmouseout = this.binder(this.mouseout_handler, this, null);
	},

	clean_t_stones: function() {
		this.t_white.style.display = "none";
		this.t_black.style.display = "none";
	},

	clear: function() {
		this.grid = Array(this.game.size);
		for (var row = 0 ; row < this.game.size ; row++) {
			this.grid[row] = Array(this.game.size);
		}
		this.max_bound = this.game.size * STONE_SIZE + BOARD_BOUND;
		/*
		this.t_white = undefined;
		this.t_black = undefined;
		this.ko = undefined;
		*/
		this.div_board.innerHTML = "";
	},

	validate_and_load_divs: function() {
		if (this.game.div_id_board != undefined) {
			this.div_board = document.getElementById(this.game.div_id_board);
			if (this.div_board) {
				this.div_board.innerHTML = "";
			} else {
				throw new Error("GoGraphic: error finding board div.");
			}
		}
		if (this.game.div_id_clock_w != undefined) {
			this.div_clock_w = document.getElementById(this.game.div_id_clock_w);
			if (this.div_clock_w) {
				this.div_clock_w.innerHTML = "";
			} else {
				throw new Error("GoGraphic: error finding white clock div.");
			}
		}
		if (this.game.div_id_clock_b != undefined) {
			this.div_clock_b = document.getElementById(this.game.div_id_clock_b);
			if (this.div_clock_b) {
				this.div_clock_b.innerHTML = "";
			} else {
				throw new Error("GoGraphic: error finding black clock div.");
			}
		}
	},

};
