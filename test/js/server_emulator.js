// Server emulator
	function Game() {
		this.moves = "";
		this.size = 13;
		this.players = [];
	}

	Game.prototype = {
		play: function(obj) {
			var rex = /^;(B|W)\[[a-s]{2}\]$/;
			if (rex.test(obj.move)) {
				this.moves += obj.move;
				this.broadcast();
			} else {
				throw new Error("Wrong move.");
			}
		},

		connect: function(nick, callback) {
			var res;
			this.players.push(callback);
			if (this.players.length == 1) {
				this.white_player = nick;
				res = "W";
			} else if (this.players.length == 2) {
				this.black_player = nick;
				res = "B";
			} else {
				res = "O";
			}
			this.broadcast();
			return res;
		},

		broadcast: function() {
			var data = {black_player: this.black_player, white_player: this.white_player, moves: this.moves};
			for (var i = 0, li = this.players.length; i < li; ++i) {
				this.players[i].apply(null, [data]);
			}
		}
	}
// -----
