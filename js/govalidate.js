
function GoValidate(args) {
	this.init.call(this, args);
}

GoValidate.prototype = {
	init: function() {
		this.validate(arguments);
	},

	// Main testing function
	test: function(elem, name, type, values, default_value) {
		if (typeof elem[name] === "undefined") {
			if (typeof default_value !== "undefined") {
				elem[name] = default_value;
			}
		} else {
			if (typeof elem[name] !== type) {
				throw new Error("The '" + name + "' parameter type must be '" + type + "'.");
			} else {
				if (typeof values === "object" && values instanceof Array) {
					if (!inArray(elem[name], values)) {
						throw new Error("The '" + name + "' parameter must be in (" + values + ").");
					}
				} else if (values === true) {
					if (type === "string") {
						if (elem[name] === "") {
							throw new Error("The '" + name + "' parameter must not be empty.");
						}
					}
				}
			}
		}
	},

	// Checks if the div exists in DOM
	test_div: function(name, div_id) {
		if (typeof div_id !== "undefined") {
			if (!document.getElementById(div_id)) {
				throw new Error("The '" + name + "' parameter points to no existing div.");
			}
		}
	},

	// Adds slash to the path provided
	complete_path: function(elem, name) {
		if (typeof elem[name] === "string") {
			if (elem[name].charAt(elem[name].length - 1) != '/') {
				elem[name] += '/';
			}
		}
	},


//	Validation
	validate: function(rgmnts) {
		// Check for my "arguments" value.
		rgmnts[0] = rgmnts[0] || {};
		// Check for GoSpeed's "arguments" value.
		rgmnts[0][0] = rgmnts[0][0] || {};
		// Shortcut
		this.args = rgmnts[0][0];

		var options;
		var target;

		// Size
			this.test(this.args, "size", "number", [9, 13, 19], 19);

		// Mode
			this.test(this.args, "mode", "string", ["play", "play_online", "free", "variation", "count", "count_online"], "play");

		// Ruleset
			this.test(this.args, "ruleset", "string", ["Japanese", "Chinese"], "Japanese");

		// DivID
			var target = "div_id_board";
			this.test(this.args, target, "string");
			this.test_div(target, this.args[target]);

		// TreeDivID
			var target = "div_id_tree";
			this.test(this.args, target, "string");
			this.test_div(target, this.args[target]);

		// Time config
			if (typeof this.args["time_settings"] !== "undefined") {
				// Time system
				this.test(this.args["time_settings"], "name", "string", ["Absolute", "Fischer", "Canadian", "Byoyomi", "Bronstein", "Hourglass", "Free"]);
				// Clocks Div IDs
				target = "div_id_clock_w";
				this.test(this.args["time_settings"], target, "string");
				this.test_div(target, this.args["time_settings"][target]);
				target = "div_id_clock_b";
				this.test(this.args["time_settings"], target, "string");
				this.test_div(target, this.args["time_settings"][target]);
			}

		// Capture Divs
			target = "div_id_captured_w";
			this.test(this.args, target, "string");
			this.test_div(target, this.args[target]);
			target = "div_id_captured_b";
			this.test(this.args, target, "string");
			this.test_div(target, this.args[target]);

		// Score Divs
			target = "div_id_score_w";
			this.test(this.args, target, "string");
			this.test_div(target, this.args[target]);
			target = "div_id_score_b";
			this.test(this.args, target, "string");
			this.test_div(target, this.args[target]);

		// Result Div
			target = "div_id_result";
			this.test(this.args, target, "string");
			this.test_div(target, this.args[target]);

		// Comments Div
			target = "div_id_comments";
			this.test(this.args, target, "string");
			this.test_div(target, this.args[target]);

		// Move Number Div
			target = "div_id_move_number";
			this.test(this.args, target, "string");
			this.test_div(target, this.args[target]);

		// Komi
			this.test(this.args, "komi", "number");

		// Shower
			this.test(this.args, "shower", "string", ["shower", "graphic"]);

		// Coordinates
			this.test(this.args, "show_coords", "boolean");

		// Markers
			this.test(this.args, "draw_markers", "boolean", undefined, true);

		// Borders
			this.test(this.args, "draw_borders", "boolean", undefined, true);

		// Shadows
			this.test(this.args, "draw_shadows", "boolean", undefined, true);

		// Colour
			this.test(this.args, "my_colour", "string", ["B", "W", "A", "O",]);

		// Nickname
			this.test(this.args, "my_nick", "string", true);

		// Callbacks
			if (typeof this.args["callbacks"] !== "undefined") {
				var id;
				for (id in this.args["callbacks"]) {
					this.test(this.args["callbacks"], id, "function");
				}
			}

		// Server Paths
			// Server Resources Path
			this.test(this.args, "server_path_gospeed_root", "string", true);
			this.complete_path(this.args, "server_path_gospeed_root");

			// Absolute URL
			this.test(this.args, "server_path_absolute_url", "string", true);
			this.complete_path(this.args, "server_path_absolute_url");

			// Game Move
			this.test(this.args, "server_path_game_move", "string", true);

			// Game End
			this.test(this.args, "server_path_game_end", "string", true);

	},
}

