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

		connect: function(callback) {
			this.players.push(callback);
			this.broadcast();
			if (this.players.length == 1) {
				return "W";
			} else if (this.players.length == 2) {
				return "B";
			} else {
				return "O";
			}
		},

		broadcast: function() {
			//var s = ";SZ[" + this.size + "]";
			//var s = ";FF[" + this.size + "]";
			var s = "";
			s += this.moves;

			for (var i = 0; i < this.players.length; i++) {
				this.players[i].call(s, s, s);
			}
		}
	}
// -----
