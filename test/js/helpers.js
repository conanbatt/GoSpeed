

	function binder(method, object, args) {
		return function(orig_args) { method.apply(object, [orig_args].concat(args)); };
	}

	function coord_converter(play) {
		return ";" + play.put.color + "[" + String.fromCharCode(97 + play.put.col) + String.fromCharCode(97 + play.put.row) + "]";
	}

	function triggerMouseMove(div, row, col, stone_size, board_bound) {
		if (window.STONE_SIZE !== undefined) {
			stone_size = window.STONE_SIZE;
		}
		if (window.BOARD_BOUND !== undefined) {
			board_bound = window.BOARD_BOUND;
		}
		div.onmousemove({pageX: (col * stone_size + board_bound + div.offsetLeft - 1 + 10), pageY: (row * stone_size + board_bound + div.offsetTop - 1 + 10)})
	}

