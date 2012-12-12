/*
*  Gospeed time management module  *
                                  */

function GoTime(gospeed, settings) {
	this.init.call(this, gospeed, settings);
}

GoTime.prototype = {
	init: function(gospeed, settings) {
		// Store parameters
		this.game = gospeed;

		// Setup
		this.setup(settings);
	},

	// Clock setup
	setup: function(time_settings) {
		if (time_settings != undefined) {
			this.settings = time_settings;
			switch(time_settings.name) {
				case "Absolute":
					this.clock = new AbsoluteTimer(this, time_settings.settings);
				break;
				case "Fischer":
					this.clock = new FischerTimer(this, time_settings.settings);
				break;
				case "Canadian":
					throw new Error("Canadian unsupported.");
					//this.clock = new CanadianTimer(this, time_settings.settings.main_time, time_settings.settings.period_time, time_settings.settings.period_stones);
				break;
				case "Byoyomi":
					this.clock = new ByoyomiTimer(this, time_settings.settings);
				break;
				case "Bronstein":
					throw new Error("Bronstein unsupported.");
					//this.clock = new BronsteinTimer(this, time_settings.settings.main_time, time_settings.settings.bonus);
				break;
				case "Hourglass":
					this.clock = new HourglassTimer(this, time_settings.settings);
				break;
			}
		}
	},

	// Clear method
	clear: function() {
		if (this.clock != undefined) {
			this.clock.stop();
		}
		this.clock = undefined;
		this.settings = undefined;
	},

	// Returns SGF string for the given settings or current settings if none given.
	settings_to_sgf: function(time_settings) {
		if (time_settings == undefined) {
			time_settings = this.settings.settings;
		}
		switch(time_settings.name) {
			case "Absolute":
				return "TM[" + time_settings.settings.main_time + "]";
			break;
			case "Fischer":
				return "OT[Fischer " + time_settings.settings.bonus + "]TM[" + time_settings.settings.main_time + "]";
			break;
			case "Canadian":
				return "UNSUPPORTED"; // TODO
				//this.clock = new CanadianTimer(this, time_settings.settings.main_time, time_settings.settings.period_time, time_settings.settings.period_stones);
			break;
			case "Byoyomi":
				return "OT[" + time_settings.settings.periods + "x" + time_settings.settings.period_time + " byo-yomi]TM[" + time_settings.settings.main_time + "]";
			break;
			case "Bronstein":
				return "UNSUPPORTED"; // TODO
				//this.clock = new BronsteinTimer(this, time_settings.settings.main_time, time_settings.settings.bonus);
			break;
			case "Hourglass":
				return "OT[Hourglass]TM[" + time_settings.settings.main_time + "]";
			break;
			default:
				return "";
			break;
		}
	},

	// Evaluates if player really losed and announces to the server
	// FIXME TODO: Should change jQuery call for callback coded in Kaya's board.js or such
	announce_time_loss: function(remain) {
		var i_lose = false;
		if (this.game.is_my_turn()) {
			switch(this.clock.system.name) {
				case "Absolute":
				case "Fischer":
				case "Hourglass":
					i_lose = (remain[this.game.get_next_move()].main_time == 0);
				break;
				case "Byoyomi":
					var my_remain = remain[this.game.get_next_move()];
					i_lose = (my_remain.main_time <= 0 && my_remain.periods <= 1 && my_remain.period_time <= 0);
				break;
			}
			if (i_lose) {
				var that = this;
				if (this.game.server_path_absolute_url != undefined && this.game.server_path_game_end != undefined) {
					$.post(this.game.server_path_absolute_url + this.game.server_path_game_end, {result: "time_loss"}, function(data, textStatus) {
						if (textStatus == "success") {
							if (typeof KAYAGLOBAL != "undefined") {
								KAYAGLOBAL.play_sound("outoftime");
							}
							that.clock.stop();
						}
					});
				}
			}
		}
		return i_lose;
	},

	// Formats given time
	format: function(seconds, complete) {
		if (complete) {
			if (seconds > 0) {
				var tmp_day, tmp_hrs, tmp_min, tmp_sec, time = "";
				tmp_day = Math.floor(seconds / 86400);
				tmp_hrs = Math.floor((seconds - tmp_day * 86400) / 3600);
				tmp_min = Math.floor((seconds - tmp_day * 86400 - tmp_hrs * 3600) / 60);
				tmp_sec = Math.floor(seconds - tmp_day * 86400 - tmp_hrs * 3600 - tmp_min * 60);
				if (tmp_day > 0) {
					time += tmp_day + "d " + tmp_hrs + "h";
				} else {
					if (tmp_hrs > 0) {
						time += tmp_hrs + "h " + tmp_min + "m";
					} else {
						if (tmp_min > 0) {
							time += this.str_complete_zero(tmp_min) + ":" + this.str_complete_zero(tmp_sec);
						} else {
							time += "00:" + this.str_complete_zero(tmp_sec);
						}
					}
				}
				return time;
			} else {
				return "00:00";
			}
		} else {
			var tmp_sec;
			if (seconds < 0) {
				seconds = 0;
			}
			tmp_sec = Math.floor(seconds);
			return this.str_complete_zero(tmp_sec);
		}
	},

	str_complete_zero: function(time) {
		if (time < 10) {
			time = "0" + time;
		}
		return time;
	},

	// Takes clock value, and depending on calculus, draws the graphic interface
	draw: function(remain) {
		// Only possible if shower is defined
		if (this.game.shower == undefined || this.clock == undefined) {
			return false;
		}

		// Default to clock remain
		if (remain == undefined) {
			remain = this.clock.remain;
		}

		var color_arr = [BLACK, WHITE];

		switch (this.clock.system.name) {
			case "Bronstein":
				throw new Error("Bronstein unsupported.");
			break;
			case "Absolute":
			case "Fischer":
				for (var color in color_arr) {
					color = color_arr[color];

					if (remain[color] != undefined) {
						this.game.shower.handle_clock_sound(remain[color].main_time, color);
						this.game.shower.format_clock_div(remain[color].main_time, color);
						this.game.shower.write_clock_value(this.format(remain[color].main_time + 0.99, true), color);
						this.game.shower.draw_t_stone_number(remain[color].main_time, color);
					}
				}
			break;
			case "Hourglass":
				for (var color in color_arr) {
					color = color_arr[color];

					if (remain[color] != undefined) {
						var tmp_remain = Math.min(remain[color].main_time, this.clock.system.main_time * 2);
						this.game.shower.handle_clock_sound(tmp_remain, color);
						this.game.shower.format_clock_div(tmp_remain, color);
						this.game.shower.write_clock_value(this.format(tmp_remain + 0.99, true), color);
						this.game.shower.draw_t_stone_number(tmp_remain, color);
					}
				}
			break;
			case "Byoyomi":
				for (var color in color_arr) {
					color = color_arr[color];

					if (remain[color] != undefined) {
						if (remain[color].main_time > 0) {
							if (remain[color].main_time > 20) {
								// Avoid playing countdown in main time... head way...
								this.game.shower.handle_clock_sound(remain[color].main_time, color);
							}
							this.game.shower.write_clock_value(this.format(remain[color].main_time + 0.99, true), color);
						} else {
							var period_label;
							if (remain[color].periods <= 1) {
								period_label = ' SD';
							} else {
								period_label = ' (' + remain[color].periods + ')';
							}
							this.game.shower.handle_clock_sound(remain[color].period_time, color);
							this.game.shower.format_clock_div(remain[color].period_time, color);
							this.game.shower.write_clock_value(this.format(remain[color].period_time + 0.99) + period_label, color);
							this.game.shower.draw_t_stone_number(remain[color].period_time, color);
						}
					}
				}
			break;
			case "Canadian":
				throw new Error("Canadiant unsupported.");
			break;
		}
	},

	// Updates clocks depending on adjustment sent by the server
	update: function(time_adjustment) {
		if (this.game.mode == "count" || this.game.mode == "count_online") {
			return false;
		}
		if (this.clock != undefined) {
			var play;
			var color;
			var end = false;
			var last_remain_black;
			var last_remain_white;
			var node = this.game.game_tree.actual_move;

			// Fetch last remain for black and white.
			while(!end) {
				play = node.play;
				if (play instanceof Play || play instanceof Pass) {
					color = play.put.color;
					if (color == "B" && last_remain_black == undefined) {
						last_remain_black = play.time_left;
					}
					if (color == "W" && last_remain_white == undefined) {
						last_remain_white = play.time_left;
					}
				}
				if (last_remain_white != undefined && last_remain_black != undefined) {
					end = true;
				} else {
					node = node.prev;
					if (node == undefined) {
						end = true;
					}
				}
			}

			// Configure default time depending on time system.
			switch(this.clock.system.name) {
				case "Absolute":
				case "Fischer":
					if (last_remain_white == undefined) {
						last_remain_white = {
							main_time: Number(this.clock.system.main_time),
						};
					}
					if (last_remain_black == undefined) {
						last_remain_black = {
							main_time: Number(this.clock.system.main_time),
						};
					}
				break;
				case "Hourglass":
					// XXX FIXME TODO: Actually, this should be handeled in the byoyomi timer.
					// Here we should call set_remain() with the LAST TIME INFO and hourglass should auto balance the other color time.
					var color = this.game.get_next_move();

					if (last_remain_black == undefined && last_remain_white == undefined) {
						last_remain_black = {
							main_time: Number(this.clock.system.main_time),
						};
						last_remain_white = {
							main_time: Number(this.clock.system.main_time),
						};
					} else if (last_remain_black == undefined) {
						last_remain_black = {
							main_time: parseFloat(this.clock.system.main_time) + (parseFloat(this.clock.system.main_time) - Number(last_remain_white.main_time)),
						};
					} else if (last_remain_white == undefined) {
						last_remain_white = {
							main_time: parseFloat(this.clock.system.main_time) + (parseFloat(this.clock.system.main_time) - Number(last_remain_black.main_time)),
						};
					} else {
						if (color == "B") {
							last_remain_black = {
								main_time: parseFloat(this.clock.system.main_time) + (parseFloat(this.clock.system.main_time) - Number(last_remain_white.main_time)),
							};
						} else {
							last_remain_white = {
								main_time: parseFloat(this.clock.system.main_time) + (parseFloat(this.clock.system.main_time) - Number(last_remain_black.main_time)),
							};
						}
					}
				break;
				case "Byoyomi":
					if (last_remain_white == undefined) {
						last_remain_white = {
							'main_time': this.clock.system.main_time,
							'period_time': this.clock.system.period_time,
							'periods': this.clock.system.periods,
						};
					}
					if (last_remain_black == undefined) {
						last_remain_black = {
							'main_time': this.clock.system.main_time,
							'period_time': this.clock.system.period_time,
							'periods': this.clock.system.periods,
						};
					}
				break;
			}

			// Finally setup clocks.
			var rmn = {};
			rmn["B"] = last_remain_black;
			rmn["W"] = last_remain_white;
			this.clock.set_remain(rmn);

			// XXX TODO FIXME: Check if this is working well... (timer resume with tick and stuff...)
			this.clock.resume(this.game.get_next_move());
			if (time_adjustment != undefined) {
				this.clock.adjust(time_adjustment);
			}
		}
	},

	// External helpers
	pause: function(do_adjustment) {
		if (this.clock != undefined) {
			return this.clock.pause(do_adjustment);
		} else {
			return false;
		}
	},

	resume: function(color, remain) {
		if (this.clock != undefined) {
			this.clock.resume(color, remain);
		}
	},

	stop: function() {
		if (this.clock != undefined) {
			this.clock.stop();
		}
	},
};

