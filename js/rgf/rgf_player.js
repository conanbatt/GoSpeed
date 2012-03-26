
function RGFPlayer(config) {
	var self = this;
	// Customize configuration
		var custom_config = {
			mode: "play",
			shower: "graphic",
			size: config.size,
			div_id_board: config.div_id_board,
			div_id_tree: config.div_id_tree,
			div_id_captured_w: config.div_id_captured_w,
			div_id_captured_b: config.div_id_captured_b,
			div_id_result: config.div_id_result,
			div_id_move_number: config.div_id_move_number,
			div_id_comments: config.div_id_comments,
			server_path_gospeed_root: config.server_path_gospeed_root,
		}

	// Initialize GoSpeed with custom config
		this.gospeed = new GoSpeed(custom_config);
		this.gospeed.mode = "rgf";
		this.gospeed.callbacks["rgf_board_click"] = function() {
			self.boardClicked.call(self, arguments[0], arguments[1])
		};

	// Private props
		this.new_node = false;
		this.recording = false;
};

RGFPlayer.prototype.createNode = function() {
	if (!this.gospeed.game_tree.actual_move.root) {
		this.new_node = true;
	}
};

RGFPlayer.prototype.addProperty = function(name, arg) {
	var pos;
	var bRes = false;
	switch(name) {
		case "B":
		case "W":
			// Check if turn corresponds with color
			if (name == this.gospeed.get_next_move()) {
				var store_mode = this.gospeed.mode;
				this.gospeed.mode = "play";
				if (arg == "") {
					// Pass
					bRes = this.gospeed.pass();
				} else {
					// Play
					pos = this.gospeed.sgf_coord_to_pos(arg)
					bRes = this.gospeed.play(pos.row, pos.col);
				}
				this.gospeed.mode = store_mode;
				this.new_node = false;
			} else {
				throw new Error("Not " + name + "'s turn...");
			}
		break;
		case "C":
			if (!this.new_node) {
				this.gospeed.game_tree.actual_move.comments = arg;
				if (this.gospeed.shower != undefined) {
					this.gospeed.shower.update_comments();
				}
				bRes = true;
			} else {
				throw new Error("New node's first property must be \"W\" or \"B\".");
			}
		break;
		case "PL":
			if (this.gospeed.game_tree.actual_move.root && this.gospeed.game_tree.root.next.length == 0) {
				this.gospeed.game_tree.root.next_move = arg;
				bRes = true;
			}
		break;
	}
	return bRes;
};

RGFPlayer.prototype.getCurrentPath = function() {
	return this.gospeed.get_path();
};

RGFPlayer.prototype.goTo = function(path) {
	return this.gospeed.goto_path(path);
};

RGFPlayer.prototype.boardClicked = function(row, col) {
	// Do some stuff related with GameStream
	// return false if it fails,
	// or run the following code to draw the stone
	var name = this.gospeed.get_next_move();
	var arg = this.gospeed.pos_to_sgf_coord(row, col);
	this.addProperty(name, arg);
};

RGFPlayer.prototype.enableRecording = function() {
	this.gospeed.mode = "play";
	this.recording = true;
	return true;
};

RGFPlayer.prototype.disableRecording = function() {
	this.gospeed.mode = "rgf";
	this.recording = false;
	return true;
};

RGFPlayer.prototype.isRecording = function() {
	return this.recording;
};
