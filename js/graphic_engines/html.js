
function HTMLEngine(manager) {
	this.manager = manager;
}

HTMLEngine.prototype = {
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
		this.last_stone["W"].style.display = "none";
		this.last_stone["B"].style.display = "none";
		this.last_stone_wait["W"].style.display = "none";
		this.last_stone_wait["B"].style.display = "none";
	},

	place_coord_marker: function(row, col) {
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

	draw_transparent_stone(color, row, col) {
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

	remove_transparent_stone: function(t_stone) {
		this.div_board.removeChild(t_stone);
	},

}
