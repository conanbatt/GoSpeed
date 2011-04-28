
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
		this.div.removeChild(this.grid[row][col][0]);
		this.div.removeChild(this.grid[row][col][1]);
	},

	binder: function (method, object, args) {
		return function(orig_args) { method.apply(object, [orig_args].concat(args)); };
	},

	click_handler: function(click) {
		var boundedX = click.pageX - this.div.offsetLeft + 1;
		var boundedY = click.pageY - this.div.offsetTop + 1;
		if (boundedX > 10 && boundedX < 485 && boundedY > 10 && boundedY < 485) {
			var gridX = parseInt((boundedX - 10) / 25, 10);
			var gridY = parseInt((boundedY - 10) / 25, 10);
			this.game.play(gridX, gridY);
		}
	},

	render: function() {
		switch(this.game.size) {
			case 19:
				this.div.style.width = "495px";
				this.div.style.height = "495px";
				this.div.style.backgroundImage = "url(img/OnlyBoard19.png)";
			break;
			case 13:
				this.div.style.width = "346px";
				this.div.style.height = "346px";
				this.div.style.backgroundImage = "url(img/OnlyBoard13.png)";
			break;
			case 9:
				this.div.style.width = "246px";
				this.div.style.height = "246px";
				this.div.style.backgroundImage = "url(img/OnlyBoard9.png)";
			break;
		}
		this.div.style.position = "relative";

		// Image prefetch (dunno if this is the right place...)
		(new Image()).src = "img/white.png";
		(new Image()).src = "img/black.png";
		(new Image()).src = "img/shadow.png";

		// Ko
		var ko = document.createElement("div");
		ko.className = "Ko";
		this.div.appendChild(ko);
		this.ko = ko;

		// Bind click handler
		this.div.onclick = this.binder(this.click_handler, this, null);
	},

};
