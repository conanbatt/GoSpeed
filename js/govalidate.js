
function GoValidate(args) {
	this.init.call(this, args);
}

GoValidate.prototype = {
	init: function() {
		this.validate(arguments);
	},

//	Validation
	validate: function(rgmnts) {
		// Check for my "arguments" value.
		rgmnts[0] = rgmnts[0] || {};
		// Check for GoSpeed's "arguments" value.
		rgmnts[0][0] = rgmnts[0][0] || {};
		// Shortcut
		var args = rgmnts[0][0];

		var options;

		with (args) {
		// Size
			if (typeof size == "undefined") {
				args.size = 19;
			} else if (typeof size == "number") {
				options = [9, 13, 19,];
				if (!inArray(size, options)) {
					throw new Error("The 'size' parameter must be in (" + options + ").");
				}
			} else {
				throw new Error("The 'size' parameter must be a number");
			}

		// Mode
			if (typeof mode == "undefined") {
				args.mode = "play";
			} else if (typeof mode == "string") {
				options = ["play", "play_online", "free", "variation", "count", "count_online",];
				if (!inArray(mode, options)) {
					throw new Error("The 'mode' parameter must be in (" + options + ").");
				}
			} else {
				throw new Error("The 'mode' parameter must be a string");
			}

		// Ruleset
			if (typeof ruleset == "undefined") {
				args.ruleset = "Japanese";
			} else if (typeof ruleset == "string") {
				options = ["Japanese", "Chinese",];
				if (!inArray(ruleset, options)) {
					throw new Error("The 'ruleset' parameter must be in (" + options + ").");
				}
			} else {
				throw new Error("The 'ruleset' parameter must be a string");
			}

		// DivID
			if (typeof div_id_board != "undefined") {
				if (typeof div_id_board != "string") {
					throw new Error("The 'div_id_board' parameter must be a string");
				} else if (!document.getElementById(div_id_board)) {
					throw new Error("The 'div_id_board' parameter points to no existing div.");
				}
			}

		// TreeDivID
			if (typeof div_id_tree != "undefined") {
				if (typeof div_id_tree != "string") {
					throw new Error("The 'div_id_tree' parameter must be a string");
				} else if (!document.getElementById(div_id_tree)) {
					throw new Error("The 'div_id_tree' parameter points to no existing div.");
				}
			}

		// Time config
			if (typeof time_config != "undefined") {
				// Time system
				if (typeof time_config.time_system != "undefined") {
					if (typeof time_config.time_system != "string") {
						throw new Error("The 'time_system' parameter must be a string");
					} else {
						options = ["Absolute", "Free", ];
						if (!inArray(time_config.time_system, options)) {
							throw new Error("The 'time_system' parameter must be in (" + options + ").");
						}
					}
				}
				if (typeof time_config.starting_time != "undefined") {
					if (typeof time_config.starting_time != "number") {
						throw new Error("The 'starting_time' parameter must be a number");
					}
				} else {
					throw new Error("As there is a time config, starting_time property is required.");
				}
				// Clocks Div IDs
				if (typeof time_config.div_id_clock_w != "undefined") {
					if (typeof time_config.div_id_clock_w != "string") {
						throw new Error("The 'div_id_clock_w' parameter must be a string");
					} else if (!document.getElementById(time_config.div_id_clock_w)) {
						throw new Error("The 'div_id_clock_w' parameter points to no existing div.");
					}
				}
				if (typeof time_config.div_id_clock_b != "undefined") {
					if (typeof time_config.div_id_clock_b != "string") {
						throw new Error("The 'div_id_clock_b' parameter must be a string");
					} else if (!document.getElementById(time_config.div_id_clock_b)) {
						throw new Error("The 'div_id_clock_b' parameter points to no existing div.");
					}
				}
			}

		// Capture Divs
			if (typeof div_id_captured_w != "undefined") {
				if (typeof div_id_captured_w != "string") {
					throw new Error("The 'div_id_captured_w' parameter must be a string");
				} else if (!document.getElementById(div_id_captured_w)) {
					throw new Error("The 'div_id_captured_w' parameter points to no existing div.");
				}
			}
			if (typeof div_id_captured_b != "undefined") {
				if (typeof div_id_captured_b != "string") {
					throw new Error("The 'div_id_captured_b' parameter must be a string");
				} else if (!document.getElementById(div_id_captured_b)) {
					throw new Error("The 'div_id_captured_b' parameter points to no existing div.");
				}
			}

		// Score Divs
			if (typeof div_id_score_w != "undefined") {
				if (typeof div_id_score_w != "string") {
					throw new Error("The 'div_id_score_w' parameter must be a string");
				} else if (!document.getElementById(div_id_score_w)) {
					throw new Error("The 'div_id_score_w' parameter points to no existing div.");
				}
			}
			if (typeof div_id_score_b != "undefined") {
				if (typeof div_id_score_b != "string") {
					throw new Error("The 'div_id_score_b' parameter must be a string");
				} else if (!document.getElementById(div_id_score_b)) {
					throw new Error("The 'div_id_score_b' parameter points to no existing div.");
				}
			}

		// Result Div
			if (typeof div_id_result != "undefined") {
				if (typeof div_id_result != "string") {
					throw new Error("The 'div_id_result' parameter must be a string");
				} else if (!document.getElementById(div_id_result)) {
					throw new Error("The 'div_id_result' parameter points to no existing div.");
				}
			}

		// Komi
			if (typeof komi != "undefined") {
				if (typeof komi != "number") {
					throw new Error("The 'komi' parameter must be a number");
				}
			}


		// Shower
			if (typeof shower != "undefined") {
				if (typeof shower != "string") {
					throw new Error("The 'shower' parameter must be a string");
				} else {
					options = ["shower", "graphic",];
					if (!inArray(shower, options)) {
						throw new Error("The 'shower' parameter must be in (" + options + ").");
					}
				}
			}

		// Colour
			if (typeof my_colour != "undefined") {
				if (typeof my_colour != "string") {
					throw new Error("The 'my_colour' parameter must be a string");
				} else {
					options = ["B", "W", "A", "O",];
					if (!inArray(my_colour, options)) {
						throw new Error("The 'my_colour' parameter must be in (" + options + ").");
					}
				}
			}

		// Nickname
			if (typeof my_nick != "undefined") {
				if (typeof my_nick != "string") {
					throw new Error("The 'my_nick' parameter must be a string");
				} else {
					if (my_nick == "") {
						throw new Error("The 'my_nick' parameter must not be empty");
					}
				}
			}

		// Server Paths
			// Server Resources Path
			if (typeof server_path_gospeed_root != "undefined") {
				if (typeof server_path_gospeed_root != "string") {
					throw new Error("The 'server_path_gospeed_root' parameter must be a string");
				} else {
					if (server_path_gospeed_root == "") {
						throw new Error("The 'server_path_gospeed_root' parameter must not be empty");
					} else {
						if (server_path_gospeed_root.charAt(server_path_gospeed_root.length - 1) != '/') {
							args.server_path_gospeed_root += '/';
						}
					}
				}
			}

			// Absolute URL
			if (typeof server_path_absolute_url != "undefined") {
				if (typeof server_path_absolute_url != "string") {
					throw new Error("The 'server_path_absolute_url' parameter must be a string");
				} else {
					if (server_path_absolute_url == "") {
						throw new Error("The 'server_path_absolute_url' parameter must not be empty");
					} else {
						if (server_path_absolute_url.charAt(server_path_absolute_url.length - 1) != '/') {
							args.server_path_absolute_url += '/';
						}
					}
				}
			}

			// Game Move
			if (typeof server_path_game_move != "undefined") {
				if (typeof server_path_game_move != "string") {
					throw new Error("The 'server_path_game_move' parameter must be a string");
				} else {
					if (server_path_game_move == "") {
						throw new Error("The 'server_path_game_move' parameter must not be empty");
					}
				}
			}

			// Game End
			if (typeof server_path_game_end != "undefined") {
				if (typeof server_path_game_end != "string") {
					throw new Error("The 'server_path_game_end' parameter must be a string");
				} else {
					if (server_path_game_end == "") {
						throw new Error("The 'server_path_game_end' parameter must not be empty");
					}
				}
			}
		}
		// Save GoSpeed cleaned arguments;
		this.clean_args = args;
	},
}

