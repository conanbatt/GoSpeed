var SGFPARSER_ST_ERROR = "ERROR"; // 1
var SGFPARSER_ST_PARSED = "PARSED"; // 2
var SGFPARSER_ST_LOADED = "LOADED"; // 4

function SGFNode() {
	this.prev = null;
	this.next = [];
	this.last_next = null;
}

SGFNode.prototype = {
	appendNext: function(node) {
		node.prev = this;
		this.next.push(node);
		if (this.last_next == null) {
			this.last_next = node;
		}
	}
}

function SGFParser(sSGF) {
	this.init.apply(this, [sSGF]);
}

SGFParser.prototype = {
	init: function(sSGF) {
		this.sgf = sSGF;
		this.root = null;
		this.pointer = null;
		this.sgfLoad();
	},

	appendNode: function(node) {
		if (this.pointer == null) {
			node.prev = null;
			this.root = node;
			this.pointer = node;
		} else {
			node.prev = this.pointer;
			this.pointer.next.push(node);
			this.pointer.last_next = node;
			this.pointer = node;
		}
	},

	sgfLoad: function() {
		this.root = null;
		this.pointer = null;
		var new_node;
		var nodes_for_var = [];	// Track the last node where a variation started.

		var chr = '';
		var file_len = this.sgf.length;
		var i = 0;
		var esc_next = false;
		var prop_ident;
		var prop_val;
		var propsFound = [];
		var rex_pos = /^[a-z]{2}$/;

		while (i < file_len) {
			chr = this.sgf[i];
			switch(chr) {
				case "\\":
					esc_next = true;
				break;
				case "(":
					nodes_for_var.push(this.pointer);
				break;
				case ")":
					this.pointer = nodes_for_var.pop();
				break;
				case ";":
					if (!esc_next) {
						// New node
						i += this.sgfHandleNode(i + 1);
					}
				break;
				default:
					if (!/\s/.test(chr)) {
						this.status = SGFPARSER_ST_ERROR;
						this.error = "Unexpected character";
						return false;
					}
				break;
			}
			i++;
		}

		// Result
		if (this.root == null) {
			this.status = SGFPARSER_ST_ERROR;
			this.error = "Empty SGF";
			return false;
		} else {
			this.status = SGFPARSER_ST_PARSED;
			return true;
		}
	},

	sgfHandleNode: function(buf_start) {
		var prop_end = false;
		var buf_end = buf_start;
		var rex_prop = /^[A-Z]$/
		var prop_ident = "";
		var prop_val = "";
		var prop_arr = [];
		var cur_char = '';
		var esc_next = false;

		this.appendNode(new SGFNode());

		while (!prop_end) {
			while (!prop_end) {
				cur_char = this.sgf[buf_end];
				if (rex_prop.test(cur_char)) {
					prop_ident += cur_char;
				} else if (cur_char == '[') {
					prop_end = true;
				}
				buf_end++;
			}
			prop_end = false;
			while (!prop_end) {
				cur_char = this.sgf[buf_end];
				if (cur_char == '\\') {
					prop_val += cur_char;
					esc_next = true;
				} else if (!esc_next && cur_char == ']') {
					prop_arr.push(prop_val);
					prop_val = "";
					if (this.sgf[buf_end + 1] != '[') {
						prop_end = true;
					} else {
						buf_end++;
					}
				} else {
					prop_val += cur_char;
					esc_next = false;
				}
				buf_end++;
			}

			if (prop_arr.length == 1) {
				prop_arr = prop_arr[0];
			}

			this.pointer[prop_ident] = prop_arr;
			prop_arr = [];
			prop_ident = "";
			prop_val = "";
			buf_end += this.sgfEatBlank(buf_end);
			if (rex_prop.test(this.sgf[buf_end])) {
				prop_end = false;
			}
		}
		return buf_end - buf_start;
	},

	sgfEatBlank: function(buf_start) {
		var buf_end = buf_start;
		var cur_char = '';
		var end = false;
		while (!end) {
			cur_char = this.sgf[buf_end];
			switch (cur_char) {
				case '\n':
				break;
				case ' ':
				break;
				case '\\':
					esc_next = true;
				break;
				default:
					end = true;
				break;
			}
			buf_end++;
		}
		return buf_end - buf_start - 1;
	},

	sgfToData: function() {
		var sRes = "";
		if (this.root != null) {
			var prop = "";
			var oNode = this.root;
			var end = false;
			while(!end) {
				for (var e in oNode.properties) {
					prop = oNode.properties[e].prop;
					if (prop == "B" || prop == "W") {
						val = oNode.properties[e].val.toUpperCase();
						sRes += val[0] + "-" + (val.charCodeAt(1) - 65) + ",";
					}
				}
				oNode = oNode.last_next;
				if (oNode == null) {
					end = true;
				}
			}
		}
		return sRes;
	}
}

