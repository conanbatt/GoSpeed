
function GoGraphic(game, div_id) {
	this.init.call(this, game, div_id);
}

GoGraphic.prototype = {
	init: function(game, div_id) {
		this.game = game;
		this.div = document.getElementById(div_id);
		this.grid = Array(this.game.size);
		for (row = 0 ; row < this.game.size ; row++) {
			this.grid[row] = Array(this.game.size);
		}
		this.max_bound = this.game.size * 25 + 10;
		this.div.innerHTML = "";
	},

	put_stone: function(color, row, col) {
		var stone = document.createElement("div");
		var stoneLeft = row * 25 + 10;
		var stoneTop = col * 25 + 10;
		stone.className = "Stone" + color;
		stone.style.left = stoneLeft + "px";
		stone.style.top = stoneTop + "px";
		this.div.appendChild(stone);

		var shadow = document.createElement("div");
		shadow.className = "Shadow";
		shadow.style.left = (stoneLeft + 2) + "px";
		shadow.style.top = (stoneTop + 2) + "px";
		this.div.appendChild(shadow);

		this.clean_t_stones();
		this.grid[row][col] = [stone, shadow];
	},

	place_ko: function(ko) {
		this.ko.style.left = (ko.row * 25 + 10) + "px";
		this.ko.style.top = (ko.col * 25 + 10) + "px";
		this.ko.style.display = "block";
	},

	clear_ko: function(ko) {
		this.ko.style.display = "none";
	},

	remove_stone: function(row, col) {
		if (this.grid[row][col] != null) {
			this.div.removeChild(this.grid[row][col][0]);
			this.div.removeChild(this.grid[row][col][1]);
		}
	},

	draw_play: function(play) {
		if (play instanceof FreePlay) {
			for (stone in play.remove) {
				this.remove_stone(play.remove[stone].row, play.remove[stone].col);
			}
			for (stone in play.put) {
				this.put_stone(play.put[stone].color, play.put[stone].row, play.put[stone].col);
			}
		} else {
			this.put_stone(play.put.color, play.put.row, play.put.col);
			for (stone in play.remove) {
				this.remove_stone(play.remove[stone].row, play.remove[stone].col);
			}
		}
	},

	undraw_play: function(play) {
		if (play instanceof FreePlay) {
			for (stone in play.put) {
				this.remove_stone(play.put[stone].row, play.put[stone].col);
			}
			for (stone in play.remove) {
				this.put_stone(play.remove[stone].color, play.remove[stone].row, play.remove[stone].col);
			}
		} else {
			this.remove_stone(play.put.row, play.put.col);
			for (stone in play.remove) {
				this.put_stone(play.remove[stone].color, play.remove[stone].row, play.remove[stone].col);
			}
		}
	},

	binder: function (method, object, args) {
		return function(orig_args) { method.apply(object, [orig_args].concat(args)); };
	},

	click_handler: function(click) {
		var boundedX = click.pageX - this.div.offsetLeft + 1;
		var boundedY = click.pageY - this.div.offsetTop + 1;
		if (boundedX > 10 && boundedX < this.max_bound && boundedY > 10 && boundedY < this.max_bound) {
			var gridX = parseInt((boundedX - 10) / 25, 10);
			var gridY = parseInt((boundedY - 10) / 25, 10);
			this.game.play(gridX, gridY);
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

		var boundedX = mouse.pageX - this.div.offsetLeft + 1;
		var boundedY = mouse.pageY - this.div.offsetTop + 1;
		if (boundedX <= 10 || boundedX >= this.max_bound || boundedY <= 10 || boundedY >= this.max_bound) {
			t_stone.style.display = "none";
			return false;
		}

		var gridX = parseInt((boundedX - 10) / 25, 10);
		var gridY = parseInt((boundedY - 10) / 25, 10);

		if (this.game.get_pos(gridX, gridY) != undefined) {
			t_stone.style.display = "none";
			return false;
		}

		if (this.game.pos_is_ko(gridX, gridY)) {
			t_stone.style.display = "none";
			return false;
		}

		var tmp_play = new Play(this.game.next_move, gridX, gridY);
		this.game.play_eat(tmp_play);
		if (this.game.check_illegal_move(tmp_play)) {
			t_stone.style.display = "none";
			return false;
		}

		t_stone.style.left = (gridX * 25 + 10) + "px";
		t_stone.style.top = (gridY * 25 + 10) + "px";
		t_stone.style.display = "block";

	},

	mouseout_handler: function(mouse) {
		var hide = false;
		if (mouse.relatedTarget == null) {
			this.clean_t_stones();
		} else {
			if (mouse.relatedTarget == this.div) {
				return;
			}
			if (mouse.relatedTarget.parentNode != this.div) {
				this.clean_t_stones();
			}
		}
	},

	render: function() {
		switch(this.game.size) {
			case 19:
				this.div.style.width = "495px";
				this.div.style.height = "495px";
				this.div.className = "OnlyBoard19";
				//this.div.style.backgroundImage = "url(img/OnlyBoard19.png)";
			break;
			case 13:
				this.div.style.width = "346px";
				this.div.style.height = "346px";
				this.div.className = "OnlyBoard13";
				//this.div.style.backgroundImage = "url(img/OnlyBoard13.png)";
			break;
			case 9:
				this.div.style.width = "246px";
				this.div.style.height = "246px";
				this.div.className = "OnlyBoard9";
				//this.div.style.backgroundImage = "url(img/OnlyBoard9.png)";
			break;
		}
		this.div.style.position = "relative";

		// Image prefetch (dunno if this is the right place...)
		(new Image()).src = "img/white.png";
		(new Image()).src = "img/black.png";
		(new Image()).src = "img/t_white.png";
		(new Image()).src = "img/t_black.png";
		(new Image()).src = "img/shadow.png";

		// Transparent Stones
		var t_white = document.createElement("div");
		t_white.className = "StoneTW";
		this.div.appendChild(t_white);
		this.t_white = t_white;
		var t_black = document.createElement("div");
		t_black.className = "StoneTB";
		this.div.appendChild(t_black);
		this.t_black= t_black;

		// Ko
		var ko = document.createElement("div");
		ko.className = "Ko";
		this.div.appendChild(ko);
		this.ko = ko;

		// Bind mouse handlers
		this.div.onclick = this.binder(this.click_handler, this, null);
		this.div.onmousemove = this.binder(this.mousemove_handler, this, null);
		this.div.onmouseout = this.binder(this.mouseout_handler, this, null);
	},

	clean_t_stones: function() {
		this.t_white.style.display = "none";
		this.t_black.style.display = "none";
	},

	clear: function() {
		this.grid = Array(this.game.size);
		for (row = 0 ; row < this.game.size ; row++) {
			this.grid[row] = Array(this.game.size);
		}
		this.max_bound = this.game.size * 25 + 10;
		this.div.innerHTML = "";
	},

};
