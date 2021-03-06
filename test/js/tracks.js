
var BOARD_SIZE = 19;
var BOARD_RULESET = "Japanese";
var BOARD_MODE = "play";

var gospeed;

module("Tracks", {
	setup: function() {
		var conf = {
			size: BOARD_SIZE,
			ruleset: BOARD_RULESET,
			mode: BOARD_MODE
		};
		gospeed = new GoSpeed(conf);
	}
});


var mock_variation = "aabbccdd";
var mock_conflicting_variation = "aaaabb";


test("loading a track", function(){
    var track_id = 1;
    ok(gospeed.load_track("root", mock_variation, track_id));
    ok(gospeed.switch_to_track(track_id));
    equal(gospeed.board.grid[0][0], "B","it has the variation stone")
                //gospeed.load_track($(this).attr("move") + " " + $(this).attr("variation"),i Number($(this).attr("variant-id")));
                //gospeed.switch_to_track(Number($(this).attr("variant-id")));
});

test("loading an invalid track", function(){

    ok(gospeed.load_track("root", mock_conflicting_variation, 2))
    ok(gospeed.switch_to_track(2));
    notEqual(gospeed.board.grid[1][1], "B", "it has the variation stone")
    notEqual(gospeed.board.grid[0][0], "B", "it has the variation stone but it shouldnt!")


});

var more_vars = "aaabacad"
var trying_to_break_vars = "aaabacae"

test("loading more tracks", function(){
    ok(gospeed.load_track("root", mock_variation, 1));
    ok(gospeed.switch_to_track(1));

    ok(gospeed.load_track("root", more_vars, 2));
    ok(gospeed.switch_to_track(2));

    equal(gospeed.board.grid[3][0],"W", "It has the last stone of the variation");

    ok(gospeed.load_track("root", trying_to_break_vars, 3))
    ok(gospeed.switch_to_track(3))

    notEqual(gospeed.board.grid[3][0],"W", "It doesnt have the last stone of the previous var");
    equal(gospeed.board.grid[4][0],"W", "It has the last stone of the variation");
});

test("trying to override ids should throw error",function(){

    ok(gospeed.load_track("root", mock_variation, 5));
    ok(gospeed.switch_to_track(5));

    try{
        ok(gospeed.load_track("root", trying_to_break_vars,5))
        ok(gospeed.switch_to_track(5))
        ok(false, "shouldnt get here");
    }catch(e){
        ok(e);
    }
});

