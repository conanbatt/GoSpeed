
function Canvas2DEngine(manager, args) {
	this.init.call(this, manager, args);
}

Canvas2DEngine.prototype = {
	init: function(manager, args) {
		this.manager = manager;

		// Validation
		this.validate_and_load_divs(args);
	},
/*
*   Board drawing primitives   *
                              */
	draw_stone: function(color, row, col) {
		var stone = document.createElement("div");
		var stoneLeft = col * STONE_SIZE + BOARD_BOUND;
		var stoneTop = row * STONE_SIZE + BOARD_BOUND;
		stone.className = "Stone" + color;
		stone.style.left = stoneLeft + "px";
		stone.style.top = stoneTop + "px";
		this.div_board.appendChild(stone);

		var shadow = document.createElement("div");
		shadow.className = "Shadow";
		shadow.style.left = (stoneLeft + SHADOW_SIDE * SHADOW_LEFT) + "px";
		shadow.style.top = (stoneTop + SHADOW_TOP) + "px";
		this.div_board.appendChild(shadow);

		return {
			stone: stone,
			shadow: shadow,
		};
	},

	draw_little_stone: function(color, row, col) {
		var stone = document.createElement("div");
		var stoneLeft = col * STONE_SIZE + BOARD_BOUND;
		var stoneTop = row * STONE_SIZE + BOARD_BOUND;
		stone.className = "LittleStone" + color;
		stone.style.left = stoneLeft + "px";
		stone.style.top = stoneTop + "px";
		this.div_board.appendChild(stone);

		return stone;
	},

	draw_last_stone_wait_marker: function(put) {
		this.clear_last_stone_markers();
		this.last_stone_wait[put.color].style.left = (put.col * STONE_SIZE + BOARD_BOUND) + "px";
		this.last_stone_wait[put.color].style.top = (put.row * STONE_SIZE + BOARD_BOUND) + "px";
		this.last_stone_wait[put.color].style.display = "block";
	},

	draw_last_stone_marker: function(put) {
		this.clear_last_stone_markers();
		this.last_stone[put.color].style.left = (put.col * STONE_SIZE + BOARD_BOUND) + "px";
		this.last_stone[put.color].style.top = (put.row * STONE_SIZE + BOARD_BOUND) + "px";
		this.last_stone[put.color].style.display = "block";
	},

	clear_last_stone_markers: function() {
		this.last_stone[WHITE].style.display = "none";
		this.last_stone[BLACK].style.display = "none";
		this.last_stone_wait[WHITE].style.display = "none";
		this.last_stone_wait[BLACK].style.display = "none";
	},

	draw_coord_marker: function(row, col) {
		this.coord_marker.style.left = (col * STONE_SIZE + BOARD_BOUND) + "px";
		this.coord_marker.style.top = (row * STONE_SIZE + BOARD_BOUND) + "px";
		this.coord_marker.style.display = "block";
	},

	clear_coord_marker: function() {
		this.coord_marker.style.display = "none";
	},

	draw_ko: function(ko) {
		this.ko.style.left = (ko.col * STONE_SIZE + BOARD_BOUND) + "px";
		this.ko.style.top = (ko.row * STONE_SIZE + BOARD_BOUND) + "px";
		this.ko.style.display = "block";
	},

	clear_ko: function() {
		this.ko.style.display = "none";
	},

	remove_stone: function(stone, shadow) {
		this.div_board.removeChild(stone);
		this.div_board.removeChild(shadow);
	},

	remove_little_stone: function(little_stone) {
		this.div_board.removeChild(little_stone);
	},

	draw_number: function(stone, num) {
		stone.innerHTML = num;
	},

	hide_stone: function(stone, shadow) {
		stone.style.display = "none";
		shadow.style.display = "none";
	},

	show_stone: function(stone, shadow) {
		stone.style.display = "block";
		shadow.style.display = "block";
	},

	draw_transparent_stone: function(color, row, col) {
		var stone = document.createElement("div");
		var stoneLeft = col * STONE_SIZE + BOARD_BOUND;
		var stoneTop = row * STONE_SIZE + BOARD_BOUND;
		stone.className = "StoneT" + color;
		stone.style.left = stoneLeft + "px";
		stone.style.top = stoneTop + "px";
		stone.style.display = "block";
		this.div_board.appendChild(stone);

		return stone;
	},

	draw_t_stone_number: function(color, number) {
		this.t_stones[color].innerHTML = number;
	},

	clear_t_stone_numbers: function() {
		this.t_stones[WHITE].innerHTML = "";
		this.t_stones[BLACK].innerHTML = "";
	},

	remove_transparent_stone: function(t_stone) {
		this.div_board.removeChild(t_stone);
	},

	draw_hoshi: function(row, col) {
		this.bg_ct.beginPath();
		this.bg_ct.arc(col * this.stone_size + this.bound_size, row * this.stone_size + this.bound_size, 2.5, 0, 2 * Math.PI, false);
		this.bg_ct.closePath();
		this.bg_ct.fillStyle = "rgba(0, 0, 0, 1)";
		this.bg_ct.fill();
	},

	draw_bg: function() {
		this.bg_ct.lineWidth = 1;
		this.bg_ct.save();
		this.bg_ct.globalCompositeOperation = "destination-over"; // Los objetos puestos a continuación afectan sólo lo que se haya puesto anteriormente
		for (var i = 0, li = this.size - 1; i < li; ++i) {
			for (var j = 0, lj = this.size - 1; j < lj; ++j) {
				this.bg_ct.strokeRect(i * this.stone_size + this.bound_size, j * this.stone_size + this.bound_size, this.stone_size, this.stone_size);
				if (i != 0 && j != 0 && i != this.size - 1 && j != this.size - 1) {
					if (this.size == 9) {
						if (i % 2 == 0 && j % 2 == 0 && (i + j) % 2 == 0) {
							this.draw_hoshi(i, j)
						}
					} else if (this.size == 13) {
						if (i % 3 == 0 && j % 3 == 0 && (i + j) % 3 == 0) {
							this.draw_hoshi(i, j)
						}
					} else if (this.size == 19) {
						if (i % 6 == 3 && j % 6 == 3 && (i + j) % 6 == 0) {
							this.draw_hoshi(i, j)
						}
					}
				}
			}
		}
		this.bg_ct.drawImage(this.board_bg, 1, 1, this.last_width - 2, this.last_height -2, 0, 0, this.last_width, this.last_height);

		this.bg_ct.restore();
	},

	render: function(size) {
		// Setup
		this.size = size;
		this.div_board.style.position = "relative";
		this.last_width = this.div_board.offsetWidth;
		this.last_height = this.div_board.offsetHeight;

		// Stone size
		this.stone_size = Math.floor(this.last_width / (this.size + 0.5));

			// Tiene que ser par para que las líneas del tablero se vean bien
			if (this.stone_size % 2 == 1) {
				this.stone_size--;
			}

		// Bound size
		this.bound_size = (this.last_width - this.stone_size * (this.size - 1)) / 2;

		// Background Canvas
		this.bg_canvas = this.create_elem("canvas", "BGCanvas");
		this.bg_canvas.width = this.last_width;
		this.bg_canvas.height = this.last_height;
		this.bg_canvas.style.zIndex = "5";
		this.bg_ct = this.bg_canvas.getContext("2d");
		this.bg_ct.lineWidth = 1;
		this.bg_ct.lineCap = "square";
		this.bg_ct.lineJoin = "square";

		// Stone Canvas
		this.stone_canvas = this.create_elem("canvas", "StoneCanvas");
		this.stone_canvas.style.width = this.last_width + "px";
		this.stone_canvas.style.height= this.last_height+ "px";
		this.stone_canvas.style.zIndex = "10";
		this.stone_ct = this.stone_canvas.getContext("2d");
		this.stone_ct.lineWidth = 1;
		this.stone_ct.lineCap = "square";
		this.stone_ct.lineJoin = "square";

		// Background Image
		this.board_bg = new Image();
		var that = this;
		this.board_bg.onload = function() {
			that.draw_bg.call(that);
		}

		var tmp_path = "";
		if (this.manager.game.server_path_gospeed_root != undefined) {
			tmp_path = this.manager.game.server_path_gospeed_root;
		}
		this.board_bg.src = tmp_path + "img/WoodClear.png";


		/*
		// Transparent Stones
		this.t_stones = {};
		this.t_stones[WHITE] = this.create_elem("div", "StoneTW", true);
		this.t_stones[BLACK] = this.create_elem("div", "StoneTB", true);

		this.t_little = {};
		this.t_little[WHITE] = this.create_elem("div", "LittleStoneTW", true);
		this.t_little[BLACK] = this.create_elem("div", "LittleStoneTB", true);

		// Revive stones
		this.r_stones = {};
		this.r_stones[WHITE] = this.create_elem("div", "ReviveStoneW", true);
		this.r_stones[BLACK] = this.create_elem("div", "ReviveStoneB", true);

		// Last stone markers
		this.last_stone = {};
		this.last_stone[WHITE] = this.create_elem("div", "LastStoneW", true);
		this.last_stone[BLACK] = this.create_elem("div", "LastStoneB", true);

		// Last stone wait markers
		this.last_stone_wait = {};
		this.last_stone_wait[WHITE] = this.create_elem("div", "LastStoneWaitW", true);
		this.last_stone_wait[BLACK] = this.create_elem("div", "LastStoneWaitB", true);

		// Ko
		this.ko = this.create_elem("div", "Ko");

		// Coord Marker
		this.coord_marker = this.create_elem("div", "CoordMarker", true);

		// Bind mouse handlers
		this.div_board.onclick = this.binder(this.click_handler, this, null);
		this.div_board.onmousemove = this.binder(this.mousemove_handler, this, null);
		this.div_board.onmouseout = this.binder(this.mouseout_handler, this, null);
		*/
	},

	create_elem: function(sTag, sClass, bHidden) {
		var elem = document.createElement(sTag);
		elem.className = sClass;
		if (bHidden) {
			elem.style.display = "none";
		}
		this.div_board.appendChild(elem);
		return elem;
	},

	clean_t_stones: function() {
		this.t_stones[WHITE].style.display = "none";
		this.t_stones[BLACK].style.display = "none";
		this.t_little[WHITE].style.display = "none";
		this.t_little[BLACK].style.display = "none";
		this.r_stones[WHITE].style.display = "none";
		this.r_stones[BLACK].style.display = "none";
	},

	clear: function() {
		this.max_bound = this.manager.game.board.size * STONE_SIZE + BOARD_BOUND;
		this.div_board.innerHTML = "";
	},


/*
*   Event handling   *
                    */
	binder: function (method, object, args) {
		return function(orig_args) { method.apply(object, [orig_args].concat(args)); };
	},

	click_handler: function(mouse) {
		if (mouse) {
			event = mouse;
		}
		if ('pageX' in event) { // all browsers except IE before version 9
			var pageX = event.pageX;
			var pageY = event.pageY + MOUSE_ADJUST_Y;
		} else {  // IE before version 9
			var pageX = event.clientX + document.documentElement.scrollLeft;
			var pageY = event.clientY + document.documentElement.scrollTop + MOUSE_ADJUST_Y;
		}

		var boundedX = pageX - this.div_board.offsetLeft + 1;
		var boundedY = pageY - this.div_board.offsetTop + 1;
		if (boundedX > BOARD_BOUND && boundedX < this.max_bound && boundedY > BOARD_BOUND && boundedY < this.max_bound) {
			var gridX = parseInt((boundedX - BOARD_BOUND) / STONE_SIZE, 10);
			var gridY = parseInt((boundedY - BOARD_BOUND) / STONE_SIZE, 10);

			// XXX TODO FIXME RGF WTF IS THIS DOING HERE?!!?
			if (this.manager.game.callbacks.rgf_board_click != undefined) {
				var bOK = true;
				bOK = bOK && (this.manager.game.mode == "play");
				bOK = bOK && !event.shiftKey && !event.ctrlKey;
				bOK = bOK && this.manager.game.setup_play(gridY, gridX);
				if (bOK) {
					if (!this.manager.game.callbacks.rgf_board_click(gridY, gridX)) {
						return false;
					}
				} else {
					return false;
				}
			}
			// WOHAAAAAAA

			this.manager.game.play(gridY, gridX, event.shiftKey, event.ctrlKey);
		}
	},

	mousemove_handler: function(mouse) {
		if (!this.manager.game.connected) {
			return false;
		}

		if (mouse) {
			event = mouse;
		}
		if ('pageX' in event) { // all browsers except IE before version 9
			var pageX = event.pageX;
			var pageY = event.pageY + MOUSE_ADJUST_Y;
		} else {  // IE before version 9
			var pageX = event.clientX + document.documentElement.scrollLeft;
			var pageY = event.clientY + document.documentElement.scrollTop + MOUSE_ADJUST_Y;
		}

		var t_stone;

		if (this.manager.game.mode == "count" || (this.manager.game.mode == "count_online" && this.manager.game.my_colour != "O")) {
			this.clean_t_stones();
			var boundedX = pageX - this.div_board.offsetLeft + 1;
			var boundedY = pageY - this.div_board.offsetTop + 1;
			if (boundedX <= BOARD_BOUND || boundedX >= this.max_bound || boundedY <= BOARD_BOUND || boundedY >= this.max_bound) {
				return false;
			}

			var col = parseInt((boundedX - BOARD_BOUND) / STONE_SIZE, 10);
			var row = parseInt((boundedY - BOARD_BOUND) / STONE_SIZE, 10);

			var tmp_color = this.manager.game.board.get_pos(row, col);
			if (typeof tmp_color === "string") {
				if (event.shiftKey) {
					t_stone = this.r_stone[tmp_color];
				} else {
					t_stone = this.t_little[tmp_color];
				}
			} else {
				return false;
			}
			t_stone.style.left = (col * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.top = (row * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.display = "block";
			return false;

		} else {

			switch (this.manager.game.mode) {
				case "free":
					t_stone = this.t_stones[WHITE];
				break;
				case "play":
				case "variation":
					t_stone = this.t_stones[this.manager.game.get_next_move()];
				break;
				case "play_online":
					if (this.manager.game.is_my_turn()) {
						t_stone = this.t_stones[this.manager.game.get_next_move()];
					} else {
						t_stone = null;
					}
				break;
			}

			if (t_stone == null) {
				this.clean_t_stones();
				return false;
			}

			var boundedX = pageX - this.div_board.offsetLeft + 1;
			var boundedY = pageY - this.div_board.offsetTop + 1;
			if (boundedX <= BOARD_BOUND || boundedX >= this.max_bound || boundedY <= BOARD_BOUND || boundedY >= this.max_bound) {
				t_stone.style.display = "none";
				return false;
			}

			var col = parseInt((boundedX - BOARD_BOUND) / STONE_SIZE, 10);
			var row = parseInt((boundedY - BOARD_BOUND) / STONE_SIZE, 10);

			if (this.manager.game.board.get_pos(row, col) != undefined) {
				t_stone.style.display = "none";
				return false;
			}

			if (this.manager.game.board.pos_is_ko(row, col)) {
				t_stone.style.display = "none";
				return false;
			}

			var tmp_play = new Play(this.manager.game.get_next_move(), row, col);
			this.manager.game.board.play_eat(tmp_play);
			if (this.manager.game.board.play_check_suicide(tmp_play)) {
				t_stone.style.display = "none";
				return false;
			}

			t_stone.style.left = (col * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.top = (row * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.display = "block";
		}
	},

	mouseout_handler: function(mouse) {
		if (mouse) {
			event = mouse;
		}
		var hide = false;
		if (event.relatedTarget == null) {
			this.clean_t_stones();
		} else {
			if (event.relatedTarget == this.div_board) {
				return;
			}
			if (event.relatedTarget.parentNode != this.div_board) {
				this.clean_t_stones();
			}
		}
	},


/*
*   Validation   *
                */
	validate_and_load_divs: function(args) {
		this.manager.test_and_store_div(args, "div_id_board", this, "div_board", true);
	},

}
