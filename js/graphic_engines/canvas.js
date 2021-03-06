var MOUSE_ADJUST_Y = 0;
// Global animation definition
requestAnimationFrame = window.requestAnimationFrame ||
						window.mozRequestAnimationFrame ||
						window.webkitRequestAnimationFrame ||
						window.msRequestAnimationFrame ||
						function (callback, element) {
							window.setTimeout(callback, 1000 / 60);
						};


function Canvas2DEngine(manager, args) {
	this.init.call(this, manager, args);
}

Canvas2DEngine.prototype = {
	init: function(manager, args) {
		this.manager = manager;
		this.args = args;

		// Validation
		this.validate_and_load_divs(args);

		// Setup
		if (this.args.small_board_optimization) {
			this.hoshi_min_radius = 1;
		} else {
			this.hoshi_min_radius = 1.5;
		}

		// Image fetching
		this.board_bg = new Image();
		var that = this;
		this.board_bg.onload = function() {
			that.bg_loaded = true;
		}
		var tmp_path = "";
		if (this.manager.game.server_path_gospeed_root != undefined) {
			tmp_path = this.manager.game.server_path_gospeed_root;
		}
		this.board_bg.src = tmp_path + "img/WoodClearBig.jpg";

	},
/*
*   Board drawing primitives   *
                              */
	// Stones
	draw_stone: function(color, row, col) {
		this.stone_ct.drawImage(this.stones[color], col * this.stone_size, row * this.stone_size);
		return {
			stone: {
				color: color,
				row: row,
				col: col,
			},
		};
	},

	draw_shadow: function(row, col) {
		this.shadow_ct.drawImage(this.shadow, col * this.stone_size, row * this.stone_size);
	},

	remove_stone: function(target) {
		if (target.stone != undefined) {
			this.stone_ct.clearRect(this.stone_size * target.stone.col, this.stone_size * target.stone.row, this.stone_size, this.stone_size);
			this.shadow_ct.clearRect(this.stone_size * target.stone.col, this.stone_size * target.stone.row, this.stone_size, this.stone_size);
		}
	},

	// Last Stone Markers
	draw_last_stone_wait_marker: function(put) {
		this.clear_last_stone_markers();
		// Setup
		var x = put.col * this.stone_size + this.stone_size / 2.0;
		var y = put.row * this.stone_size + this.stone_size / 2.0;
		var size = Math.floor(this.stone_size / 4.0);
		var lw = Math.floor(this.stone_size / 20.0);
		if (lw == 0) {
			lw++;
		}
		this.last_stone_wait_marker = {
			row: put.row,
			col: put.col,
			lw: lw,
			ss: (put.color == BLACK ? "#FFF" : "#000"),
			x: x,
			y: y,
			size: size,
			angle: 0,
		};
		this.animate_last_stone_wait_marker();
	},

	animate_last_stone_wait_marker: function() {
		var ct = this.marker_ct;
		var m = this.last_stone_wait_marker;
		if (m != undefined) {
			ct.save();
				ct.translate(m.x, m.y);
				ct.rotate(m.angle);
				ct.clearRect(m.size * -0.5 - m.lw, m.size * -0.5 - m.lw, m.size + m.lw * 2, m.size + m.lw * 2);
				ct.rotate(Math.PI / 90);
				ct.lineWidth = m.lw;
				ct.strokeStyle = m.ss;
				ct.strokeRect(m.size / -2.0, m.size / -2.0, m.size, m.size);
			ct.restore();
			m.angle = (m.angle + Math.PI / 90) % (Math.PI * 2);
			requestAnimationFrame(this.binder(this.animate_last_stone_wait_marker, this));
		}
	},

	draw_last_stone_marker: function(put) {
		this.clear_last_stone_markers();
		// Setup
		var lw = Math.floor(this.stone_size / 20.0);
		if (lw == 0) {
			lw++;
		}
		var size = Math.floor(this.stone_size / 4.0);
		// Pre-Fix to grid
		if (lw % 2 == 1) {
			if (size % 2 == 1) {
				size++;
			}
		} else {
			if (size % 2 == 0) {
				size++;
			}
		}
		var x = Math.floor((put.col + 0.375) * this.stone_size); // put.col * this.stone_size + this.stone_size * 0.5 - size * 0.5
		var y = Math.floor((put.row + 0.375) * this.stone_size); // put.row * this.stone_size + this.stone_size * 0.5 - size * 0.5
		// Fix to grid
		if (lw % 2 == 1) {
			x += 0.5;
			y += 0.5;
		}

		var ct = this.marker_ct;
		ct.save();
			if (put.color == BLACK) {
				ct.strokeStyle = "#FFF";
			} else {
				ct.strokeStyle = "#000";
			}
			ct.lineWidth = lw;
			ct.strokeRect(x, y, size, size);
		ct.restore();
		this.last_stone_marker = {
			color: put.color,
			row: put.row,
			col: put.col,
		};
	},

	clear_last_stone_marker: function() {
		if (this.last_stone_marker != undefined) {
			var row = this.last_stone_marker.row;
			var col = this.last_stone_marker.col;
			this.last_stone_marker = undefined;
			this.marker_ct.clearRect(col * this.stone_size, row * this.stone_size, this.stone_size, this.stone_size);
			this.redraw_markers(row, col);
		}
	},

	clear_last_stone_wait_marker: function() {
		if (this.last_stone_wait_marker != undefined) {
			var row = this.last_stone_wait_marker.row;
			var col = this.last_stone_wait_marker.col;
			this.last_stone_wait_marker = undefined;
			this.marker_ct.clearRect(col * this.stone_size, row * this.stone_size, this.stone_size, this.stone_size);
			this.redraw_markers(row, col);
		}
	},

	clear_last_stone_markers: function() {
		this.clear_last_stone_marker();
		this.clear_last_stone_wait_marker();
	},

	// Coord Markers
	draw_coord_marker: function(row, col) {
		var lw = Math.floor(this.stone_size / 10.0);
		var x = col * this.stone_size + this.stone_size / 2.0;
		var y = row * this.stone_size + this.stone_size / 2.0;

		var ct = this.marker_ct;
		ct.save();
			ct.lineWidth = lw;
			ct.strokeStyle = "rgba(64, 160, 64, 1)";
			ct.beginPath();
			ct.arc(x, y, this.stone_size / 3.0, 0, 2 * Math.PI, false);
			ct.closePath();
			ct.stroke();
		ct.restore();
		this.coord_marker = {
			row: row,
			col: col,
		}
	},

	clear_coord_marker: function() {
		if (this.coord_marker != undefined) {
			var row = this.coord_marker.row;
			var col = this.coord_marker.col;
			this.coord_marker = undefined;
			this.marker_ct.clearRect(col * this.stone_size, row * this.stone_size, this.stone_size, this.stone_size);
			this.redraw_markers(row, col);
		}
	},

	// Fix markers
	redraw_markers: function(row, col) {
		// Last Stone Marker
		if (this.last_stone_marker != undefined) {
			if (this.last_stone_marker.row == row && this.last_stone_marker.col == col) {
				this.draw_last_stone_marker(this.last_stone_marker);
			}
		}
		// Coord Marker
		if (this.coord_marker != undefined) {
			if (this.coord_marker.row == row && this.coord_marker.col == col) {
				this.draw_coord_marker(row, col);
			}
		}
	},

	// Ko
	draw_ko: function(ko) {
		// Setup
		var lw = Math.floor(this.stone_size / 10.0);
		if (lw == 0) {
			lw++;
		}
		var size = Math.floor(this.stone_size / 2.0);
		// Pre-Fix to grid
		if (lw % 2 == 1) {
			if (size % 2 == 1) {
				size++;
			}
		} else {
			if (size % 2 == 0) {
				size++;
			}
		}
		var x = Math.floor((ko.col + 0.25) * this.stone_size); // put.col * this.stone_size + this.stone_size * 0.5 - size * 0.5
		var y = Math.floor((ko.row + 0.25) * this.stone_size); // put.row * this.stone_size + this.stone_size * 0.5 - size * 0.5
		// Fix to grid
		if (lw % 2 == 1) {
			x += 0.5;
			y += 0.5;
		}

		var ct = this.stone_ct;
		ct.save();
			ct.lineWidth = lw;
			ct.strokeRect(x, y, size, size);
		ct.restore();
		this.ko = {
			row: ko.row,
			col: ko.col,
		}
	},

	clear_ko: function() {
		if (this.ko != undefined) {
			this.stone_ct.clearRect(this.ko.col * this.stone_size, this.ko.row * this.stone_size, this.stone_size, this.stone_size);
			this.ko = undefined;
		}
	},

	// Little Stones
	draw_little_stone: function(color, row, col) {
		this.stone_ct.drawImage(this.stones[color], 0, 0, this.stone_size, this.stone_size, col * this.stone_size + this.little_stone_bound, row * this.stone_size + this.little_stone_bound, this.little_stone_size, this.little_stone_size);
		return {
			color: color,
			row: row,
			col: col,
		};
	},

	remove_little_stone: function(little_stone) {
		this.stone_ct.clearRect(little_stone.col * this.stone_size + this.little_stone_bound, little_stone.row * this.stone_size + this.little_stone_bound, this.little_stone_size, this.little_stone_size);
	},

	draw_t_little_stone: function(color, row, col) {
		var ct = this.marker_ct;

		ct.save();
			ct.globalAlpha = 0.5;
			ct.drawImage(this.stones[color], 0, 0, this.stone_size, this.stone_size, col * this.stone_size + this.little_stone_bound, row * this.stone_size + this.little_stone_bound, this.little_stone_size, this.little_stone_size);
		ct.restore();
		this.last_t_little_stone = {
			color: color,
			row: row,
			col: col,
		};
	},

	clear_last_t_little_stone: function() {
		if (this.last_t_little_stone != undefined) {
			this.marker_ct.clearRect(this.last_t_little_stone.col * this.stone_size + this.little_stone_bound, this.last_t_little_stone.row * this.stone_size + this.little_stone_bound, this.little_stone_size, this.little_stone_size);
			this.last_t_little_stone = undefined;
		}
	},

	draw_revive_stone: function(color, row, col) {
		var ct = this.marker_ct;
		ct.drawImage(this.stones[color], col * this.stone_size, row * this.stone_size);
		this.last_revive_stone = {
			color: color,
			row: row,
			col: col,
		};
	},

	clear_last_revive_stone: function() {
		if (this.last_revive_stone != undefined) {
			this.marker_ct.clearRect(this.last_revive_stone.col * this.stone_size, this.last_revive_stone.row * this.stone_size, this.stone_size, this.stone_size);
			this.last_revive_stone = undefined;
		}
	},

	remove_transparent_stone: function(t_stone) {
		this.stone_ct.clearRect(t_stone.col * this.stone_size, t_stone.row * this.stone_size, this.stone_size, this.stone_size);
	},

	// Variation Numbers
	draw_number: function(stone, num) {
		this.stone_ct.save();
			this.stone_ct.globalAlpha = 0.75;
			this.stone_ct.font = "" + Math.floor(this.stone_size * 0.5) + "px Monospace"; // Shojumaru
			this.stone_ct.fillStyle = (stone.color == "B" ? "#FFF" : "#000");
			this.stone_ct.textAlign = "center";
			this.stone_ct.textBaseline = "middle";
			this.stone_ct.fillText(num, (stone.col + 0.5) * this.stone_size, (stone.row + 0.5) * this.stone_size);
		this.stone_ct.restore();
	},

	// Transparent Stone
	draw_transparent_stone: function(color, row, col, trace) {
		this.stone_ct.save();
			this.stone_ct.globalAlpha = 0.5;
			this.stone_ct.drawImage(this.stones[color], col * this.stone_size, row * this.stone_size);
			if (this.t_stone_number != undefined && trace) {
				this.stone_ct.globalAlpha = 0.75;
				this.stone_ct.font = "" + Math.floor(this.stone_size * 0.5) + "px Monospace"; // Shojumaru (bold)
				this.stone_ct.fillStyle = (color == "B" ? "#FFF" : "#000");
				this.stone_ct.textAlign = "center";
				this.stone_ct.textBaseline = "middle";
				this.stone_ct.fillText(this.t_stone_number, (col + 0.5) * this.stone_size, (row + 0.5) * this.stone_size);
			}
		this.stone_ct.restore();
		var t_stone = {
			color: color,
			row: row,
			col: col,
		};
		if (trace) {
			this.last_t_stone = t_stone;
		}
		return t_stone;
	},

	clear_last_transparent_stone: function() {
		if (this.last_t_stone != undefined) {
			this.stone_ct.clearRect(this.last_t_stone.col * this.stone_size, this.last_t_stone.row * this.stone_size, this.stone_size, this.stone_size);
			this.last_t_stone = undefined;
		}
	},

	clean_t_stones: function() {
		this.clear_last_transparent_stone();
		this.clear_last_t_little_stone();
		this.clear_last_revive_stone();
	},

	redraw_transparent_stone: function() {
		if (this.last_t_stone != undefined) {
			var tmp = this.last_t_stone;
			this.clear_last_transparent_stone();
			this.draw_transparent_stone(tmp.color, tmp.row, tmp.col, true);
		}
	},

	// Transparent stone numbers
	draw_t_stone_number: function(color, number) {
		this.t_stone_number = number;
		this.redraw_transparent_stone();
	},

	clear_t_stone_numbers: function() {
		this.t_stone_number = undefined;
		this.redraw_transparent_stone();
	},

	// Background
	draw_bg: function() {
		if (this.bg_loaded) {
			// Context
			var ct = this.board_ct;
			var bound_adjustment = this.bound_size + this.stone_size / 2.0;

			// Push
			ct.save();

			if (this.args.show_coords) {
				// First shadow rectangle
				ct.fillStyle = "rgba(0, 0, 0, 0.2)";
				ct.fillRect(0, 0, this.last_width, this.last_height);

				ct.globalCompositeOperation = "destination-out";

				// Cut letters (hard to soft shadow)
				ct.fillStyle = "#000";
				ct.font = "bold " + Math.floor(this.stone_size * 0.5) + "px Ubuntu, Sans, Monospace"; // Shojumaru
				ct.textAlign = "center";
				ct.textBaseline = "middle";

				var shadow_padding = Math.ceil(this.stone_size * 0.03);
				for (var i = 0, li = this.size; i < li; ++i) {
					var letter = String.fromCharCode(65 + (i > 7 ? i + 1 : i));
					ct.fillText(letter, Math.floor(this.bound_size + i * this.stone_size + this.stone_size * 0.5) - shadow_padding, Math.floor(this.bound_size * 0.5) + shadow_padding);
					ct.fillText(letter, Math.floor(this.bound_size + i * this.stone_size + this.stone_size * 0.5) - shadow_padding, Math.floor(this.last_height - this.bound_size * 0.5) + shadow_padding);
					ct.fillText(this.size - i, Math.floor(this.bound_size * 0.5) - shadow_padding, Math.floor(this.bound_size + i * this.stone_size + this.stone_size * 0.5) + shadow_padding);
					ct.fillText(this.size - i, Math.floor(this.last_width - this.bound_size * 0.5) - shadow_padding, Math.floor(this.bound_size + i * this.stone_size + this.stone_size * 0.5) + shadow_padding);
				}

				ct.globalCompositeOperation = "destination-over";

				// Second shadow rectangle (soft shadow bg)
				ct.fillStyle = "rgba(0, 0, 0, 0.2)";
				ct.fillRect(0, 0, this.last_width, this.last_height);
				ct.fillStyle = "#000";

				// Background wood texture (after soft shadow)
				ct.drawImage(this.board_bg, 0, 0, this.board_bg.width, this.board_bg.height, 0, 0, this.last_width, this.last_height);

				ct.globalCompositeOperation = "source-over";

				// Foreground wood texture with letters carved
				var tmp_canvas = document.createElement("canvas");
				tmp_canvas.style.backgroundColor = "#000";
				tmp_canvas.width = this.last_width;
				tmp_canvas.height = this.last_height;
				var ct2 = tmp_canvas.getContext("2d");
				ct2.drawImage(this.board_bg, 0, 0, this.board_bg.width, this.board_bg.height, 0, 0, this.last_width, this.last_height);
				ct2.globalCompositeOperation = "destination-out";

				ct2.fillStyle = "#000";
				ct2.font = "bold " + Math.floor(this.stone_size * 0.5) + "px Ubuntu, Sans, Monospace"; // Shojumaru
				ct2.textAlign = "center";
				ct2.textBaseline = "middle";
				for (var i = 0, li = this.size; i < li; ++i) {
					var letter = String.fromCharCode(65 + (i > 7 ? i + 1 : i));
					ct2.fillText(letter, Math.floor(this.bound_size + i * this.stone_size + this.stone_size * 0.5), Math.floor(this.bound_size * 0.5));
					ct2.fillText(letter, Math.floor(this.bound_size + i * this.stone_size + this.stone_size * 0.5), Math.floor(this.last_height - this.bound_size * 0.5));
					ct2.fillText(this.size - i, Math.floor(this.bound_size * 0.5), Math.floor(this.bound_size + i * this.stone_size + this.stone_size * 0.5));
					ct2.fillText(this.size - i, Math.floor(this.last_width - this.bound_size * 0.5), Math.floor(this.bound_size + i * this.stone_size + this.stone_size * 0.5));
				}

				ct.globalCompositeOperation = "source-over";

				// Draw foreground over background
				ct.drawImage(tmp_canvas, 0, 0);
			} else {
				ct.drawImage(this.board_bg, 0, 0, this.board_bg.width, this.board_bg.height, 0, 0, this.last_width, this.last_height);
			}

			// Draw lines
			ct.lineWidth = 1;
			if (this.args.small_board_optimization) {
				ct.globalAlpha = 0.2;
			}
			ct.beginPath();
			for (var i = 0, li = this.size; i < li; ++i) {
				ct.moveTo(bound_adjustment, i * this.stone_size + bound_adjustment);
				ct.lineTo(bound_adjustment + (this.size - 1) * this.stone_size, i * this.stone_size + bound_adjustment);
				ct.moveTo(i * this.stone_size + bound_adjustment, bound_adjustment);
				ct.lineTo(i * this.stone_size + bound_adjustment, bound_adjustment + (this.size - 1) * this.stone_size);
			}
			ct.stroke();
			if (this.args.small_board_optimization) {
				ct.globalAlpha = 1;
			}

			// TODO: there should be a unique math formula to distribute hoshis...
			// Draw hoshis
			for (var i = 0, li = this.size; i < li; ++i) {
				for (var j = 0; j < li; ++j) {
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

			// Highlights n' Shadows
			if (this.args.draw_borders) {
				ct.globalAlpha = 0.2;
				ct.lineWidth = 1;
				ct.strokeStyle = "#FFF";
				ct.beginPath();
				ct.moveTo(0.5, 0.5);
				ct.lineTo(this.last_width - 0.5, 0.5);
				ct.lineTo(this.last_width - 0.5, this.last_height - 0.5);
				ct.moveTo(1.5, 1.5);
				ct.lineTo(this.last_width - 1.5, 1.5);
				ct.lineTo(this.last_width - 1.5, this.last_height - 1.5);
				ct.stroke();

				ct.strokeStyle = "#000";
				ct.beginPath();
				ct.moveTo(this.last_width - 1.5, this.last_height - 0.5);
				ct.lineTo(0.5, this.last_height - 0.5);
				ct.lineTo(0.5, 1.5);
				ct.moveTo(this.last_width - 2.5, this.last_height - 1.5);
				ct.lineTo(1.5, this.last_height - 1.5);
				ct.lineTo(1.5, 2.5);
				ct.stroke();
			}

			// Pop
			ct.restore();
		} else {
			window.setTimeout(this.binder(this.draw_bg, this), 100);
		}
	},

	draw_hoshi: function(row, col) {
		var bound_adjustment = this.bound_size + this.stone_size / 2.0;
		var radius = this.stone_size / 15;
		if (radius < this.hoshi_min_radius) {
			radius = this.hoshi_min_radius;
		}
		if (radius > 3) {
			radius = 3;
		}
		this.board_ct.beginPath();
		this.board_ct.arc(col * this.stone_size + bound_adjustment, row * this.stone_size + bound_adjustment, radius, 0, 2 * Math.PI, false);
		this.board_ct.closePath();
		this.board_ct.fillStyle = "rgba(0, 0, 0, 1)";
		this.board_ct.fill();
	},

	render: function(size, hard) {
		if (!hard) {
			return false;
		}

		// Setup
		this.size = size;
		this.div_board.style.position = "relative";
		this.div_board.className = "Canvas";
		this.last_width = this.div_board.offsetWidth;
		this.last_height = this.div_board.offsetHeight;

		// Stone size
		this.stone_size = Math.floor(this.last_width / (this.size + 1 + (this.args.show_coords ? 1 : 0)));

		if (!this.args.small_board_optimization) {
			// It has to be odd so the stone fits with the board lines
			if (this.stone_size % 2 == 0) {
				this.stone_size--;
			}
		}

		// Little stone size
		// TODO XXX FIXME: Here the small_board_optimization makes it work for 82px board but
		// for certain dimensions like 200px the little stones are drawn but not correctly erased.
		var little_stone_ratio;
		if (this.args.small_board_optimization) {
			little_stone_ratio = 0.5;
		} else {
			little_stone_ratio = 0.4;
		}
		this.little_stone_size = Math.floor(this.stone_size * little_stone_ratio);
		if (!this.args.small_board_optimization) {
			this.little_stone_size += (this.little_stone_size % 2 == 0 ? 1 : 0);
		}
		this.little_stone_bound = (this.stone_size - this.little_stone_size) * 0.5;


		// Bound size
		this.bound_size = Math.floor((this.last_width - this.stone_size * (this.size)) / 2);
		this.bound_size_real = (this.last_width - this.stone_size * (this.size)) / 2;

		// Layers
			// Board
			this.create_layer("board", "0");

			// Shadow
			this.create_layer("shadow", "1", this.bound_size - 0.132554909 * this.stone_size, this.bound_size + 0.076530612 * this.stone_size);

			// Stone
			this.create_layer("stone", "2", this.bound_size, this.bound_size);

			// Marker
			this.create_layer("marker", "3", this.bound_size, this.bound_size);


		// Stones
		this.stones = {};

			// Black
			this.stones[BLACK] = this.create_elem("canvas", "StoneCanvas");
			this.stones[BLACK].width = this.stone_size;
			this.stones[BLACK].height = this.stone_size;
			this.draw_stone_source(BLACK);

			// White Stone
			this.stones[WHITE] = this.create_elem("canvas", "StoneCanvas");
			this.stones[WHITE].width = this.stone_size;
			this.stones[WHITE].height = this.stone_size;
			this.draw_stone_source(WHITE);

		// Shadow
		this.shadow = this.create_elem("canvas", "StoneCanvas");
		this.shadow.width = this.stone_size;
		this.shadow.height = this.stone_size;
		this.draw_shadow_source();

		// Background
		this.draw_bg();

		// Bind mouse handlers
		this.div_board.onclick = this.binder(this.click_handler, this);
		this.div_board.onmousemove = this.binder(this.mousemove_handler, this);
		this.div_board.onmouseout = this.binder(this.mouseout_handler, this);
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

	create_layer: function(name, zindex, offset_x, offset_y) {
		this[name + "_canvas"] = this.create_elem("canvas", "CanvasLayer");
		this[name + "_canvas"].width = this.last_width;
		this[name + "_canvas"].height = this.last_height;
		this[name + "_canvas"].style.zIndex = zindex;
		this[name + "_ct"] = this[name + "_canvas"].getContext("2d");
		this[name + "_ct"].lineWidth = 1;
		this[name + "_ct"].lineCap = "square";
		this[name + "_ct"].lineJoin = "square";
		if (offset_x != undefined && offset_y != undefined) {
			this[name + "_ct"].translate(offset_x, offset_y);
		}
	},

	draw_stone_source: function(color) {
		var ct = this.stones[color].getContext("2d");
		var draw_size = this.stone_size;

		ct.save();
			// Setup
			ct.translate(this.stone_size / 2.0, this.stone_size / 2.0);

			// Path
			ct.beginPath();
			ct.arc(0, 0, draw_size / 2.0, 0, 2 * Math.PI, false);
			ct.closePath();

			// Base
			var grBase = ct.createRadialGradient(0.05612244897959184 * draw_size, -0.025510204081632654 * draw_size, 0, 0.05612244897959184 * draw_size, -0.025510204081632654 * draw_size, 0.5408163265306123 * draw_size);
			if (color == BLACK) {
				grBase.addColorStop(0, "rgb(20, 20, 20)");
				grBase.addColorStop(0.94, "rgb(51, 51, 51)");
				grBase.addColorStop(1, "rgb(40, 40, 40)");
			} else {
				grBase.addColorStop(0, "rgb(255, 255, 255)");
				grBase.addColorStop(0.94, "rgb(204, 204, 204)");
				grBase.addColorStop(1, "rgb(170, 170, 170)");
			}
			ct.fillStyle = grBase;
			ct.fill();

			// Glow
			ct.save();
				ct.globalCompositeOperation = "source-atop"; // Los objetos puestos a continuación afectan sólo lo que se haya puesto anteriormente

				ct.beginPath();
				ct.moveTo(0.239795918 * draw_size, -0.443877551 * draw_size);
				ct.bezierCurveTo(0.101836469 * draw_size, -0.395557286 * draw_size, -0.005216602 * draw_size, -0.100167796 * draw_size, 0.033163265 * draw_size, -0.019132653 * draw_size);
				ct.bezierCurveTo(0.07154313265306123 * draw_size, 0.061902489795918364 * draw_size, 0.3453348163265306 * draw_size, 0.08444043877551019 * draw_size, 0.4744897959183674 * draw_size, 0.02295918367346939 * draw_size);
				ct.bezierCurveTo(0.6036447959183674 * draw_size, -0.038522071428571426 * draw_size, 0.37775536734693876 * draw_size, -0.49219781530612244 * draw_size, 0.23979591836734693 * draw_size, -0.44387755102040816 * draw_size);
				ct.closePath();

				var grBase = ct.createLinearGradient(0, 0, 0.30612244897959184 * draw_size, -0.20408163265306123 * draw_size);
				if (color == BLACK) {
					grBase.addColorStop(0, "rgba(180, 180, 180, 0.02)");
					grBase.addColorStop(1, "rgba(180, 180, 180, 0.09)");
				} else {
					grBase.addColorStop(0, "rgba(255, 255, 255, 0.2)");
					grBase.addColorStop(1, "rgba(255, 255, 255, 0.5)");
				}
				ct.fillStyle = grBase;
				ct.fill();
			ct.restore();

		ct.restore();
	},

	draw_shadow_source: function() {
		var ct = this.shadow.getContext("2d");
		var draw_size = this.stone_size - 2;

		ct.save();
			// Setup
			ct.translate(draw_size / 2.0 + 1, draw_size / 2.0 + 1);
			ct.globalCompositeOperation = "destination-over"; // Los objetos puestos a continuación afectan sólo lo que se haya puesto anteriormente

			ct.rotate(-Math.PI / 6);
			//ct.scale(1.1, 1.05);
			//ct.translate(-0.15306122448979592 * draw_size, 0);

			// Path
			ct.beginPath();
			ct.arc(0, 0, draw_size / 2.0, 0, 2*Math.PI, false);
			ct.closePath();

			// Fill
			var grBase = ct.createLinearGradient(-0.5612244897959183 * draw_size, 0, 0.05102040816326531 * draw_size, 0);
			grBase.addColorStop(1, "rgba(0, 0, 0, 0.7)");
			grBase.addColorStop(0, "rgba(0, 0, 0, 0)");
			ct.fillStyle = grBase;
			ct.fill();

		ct.restore();
	},

	clear: function(hard) {
		this.ko = undefined;
		this.last_stone_wait_marker = undefined;
		this.last_stone_marker = undefined;
		this.coord_marker = undefined;
		this.last_t_stone = undefined;
		this.last_t_little_stone = undefined;
		this.last_revive_stone = undefined;
		this.t_stone_number = undefined;
		if (hard) {
			this.div_board.innerHTML = "";
			this.div_board.onclick = undefined;
			this.div_board.onmousemove = undefined;
			this.div_board.onmouseout = undefined;
		} else {
			this.stone_ct.clearRect(0, 0, this.last_width, this.last_height);
			this.shadow_ct.clearRect(0, 0, this.last_width, this.last_height);
			this.marker_ct.clearRect(0, 0, this.last_width, this.last_height);
		}
	},


/*
*   Event handling   *
                    */
	binder: function (method, object, args) {
		return function(orig_args) {
			var final_args = [];
			for (var i = 0, li = arguments.length; i < li; ++i) {
				final_args.push(arguments[i]);
			}
			if (args != undefined) {
				for (var j = 0, lj = args.length; j < lj; ++j) {
					final_args.push(args[j]);
				}
			}
			method.apply(object, final_args);
		};
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
		if (boundedX > this.bound_size_real && boundedX < this.div_board.offsetWidth - this.bound_size_real && boundedY > this.bound_size_real && boundedY < this.div_board.offsetHeight - this.bound_size_real) {
			this.clean_t_stones();
			var gridX = parseInt((boundedX - this.bound_size_real) / this.stone_size, 10);
			var gridY = parseInt((boundedY - this.bound_size_real) / this.stone_size, 10);

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
		this.clean_t_stones();

		// Nothing if not connected
		if (!this.manager.game.connected || this.manager.game.status != ST_READY) {
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
			var boundedX = pageX - this.div_board.offsetLeft + 1;
			var boundedY = pageY - this.div_board.offsetTop + 1;
			if (boundedX <= this.bound_size_real || boundedX >= this.div_board.scrollWidth - this.bound_size_real || boundedY <= this.bound_size_real || boundedY >= this.div_board.scrollHeight - this.bound_size_real) {
				return false;
			}

			var col = parseInt((boundedX - this.bound_size_real) / this.stone_size, 10);
			var row = parseInt((boundedY - this.bound_size_real) / this.stone_size, 10);

			var tmp_color = this.manager.game.board.get_pos(row, col);
			if (typeof tmp_color === "string") {
				if (event.shiftKey) {
					if (!this.manager.can_revive(row, col)) {
						return false;
					}
					t_stone = "revive";
				} else {
					if (!this.manager.game.score.can_kill_stone(tmp_color, row, col)) {
						return false;
					}
					t_stone = "kill";
				}
			} else {
				return false;
			}
			if (t_stone == "revive") {
				this.draw_revive_stone(tmp_color, row, col);
			} else {
				this.draw_t_little_stone((tmp_color == BLACK ? WHITE : BLACK), row, col);
			}
			return false;

		} else {

			switch (this.manager.game.mode) {
				case "free":
					//t_stone = this.t_stones[WHITE];
					t_stone = WHITE;
				break;
				case "play":
				case "variation":
					//t_stone = this.t_stones[this.manager.game.get_next_move()];
					t_stone = this.manager.game.get_next_move();
				break;
				case "play_online":
					if (this.manager.game.is_my_turn()) {
						//t_stone = this.t_stones[this.manager.game.get_next_move()];
						t_stone = this.manager.game.get_next_move();
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

			if (boundedX <= this.bound_size_real || boundedX >= this.div_board.scrollWidth - this.bound_size_real || boundedY <= this.bound_size_real || boundedY >= this.div_board.scrollHeight - this.bound_size_real) {
				this.clean_t_stones();
				//t_stone.style.display = "none";
				return false;
			}

			var col = parseInt((boundedX - this.bound_size_real) / this.stone_size, 10);
			var row = parseInt((boundedY - this.bound_size_real) / this.stone_size, 10);

			if (this.manager.game.board.get_pos(row, col) != undefined) {
				//t_stone.style.display = "none";
				this.clean_t_stones();
				return false;
			}

			if (this.manager.game.board.pos_is_ko(row, col)) {
				//t_stone.style.display = "none";
				this.clean_t_stones();
				return false;
			}

			var tmp_play = new Play(this.manager.game.get_next_move(), row, col);
			this.manager.game.board.play_eat(tmp_play);
			if (this.manager.game.board.play_check_suicide(tmp_play)) {
				//t_stone.style.display = "none";
				this.clean_t_stones();
				return false;
			}

			this.draw_transparent_stone(t_stone, row, col, true);
			/*
			t_stone.style.left = (col * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.top = (row * STONE_SIZE + BOARD_BOUND) + "px";
			t_stone.style.display = "block";
			*/
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

	is_supported: function() {
		var elem = document.createElement('canvas');
		return !!(elem.getContext && elem.getContext('2d'));
	},


/*
*   Export Image   *
                  */

	get_base64_png: function(size) {
		// Store original values
		var tmp_size = this.div_board.style.width;

		// Setup small sized board config
		this.div_board.style.width = size + "px";
		this.div_board.style.height = size + "px";
		this.manager.redraw(true);

		// Merge canvases
		var tc = document.createElement("canvas");
		tc.width = size;
		tc.height = size;
		var ct = tc.getContext("2d");
		ct.drawImage(this.board_canvas, 0, 0, size, size);
		ct.drawImage(this.shadow_canvas, 0, 0, size, size);
		ct.drawImage(this.stone_canvas, 0, 0, size, size);
		ct.drawImage(this.marker_canvas, 0, 0, size, size);

		// Restore original board
		this.div_board.style.width = tmp_size;
		this.div_board.style.height = tmp_size;
		this.manager.redraw(true);

		// Retur data
		return tc.toDataURL();
	},
}
