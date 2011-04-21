(function($, undefined) {

    var canvas = { x: 1200, y: 500 };
    var cell = { x: 30, y: 30 };
    var offset = { x: 10, y: 10 };

    var render = function(commits) {
        var paper = Raphael("canvas", canvas.x, canvas.y);

        var frame = paper.path(createPath(
            ["M",0,0],
            ["L",canvas.x,0], ["L",canvas.x,canvas.y],
            ["L",0,canvas.y], ["L",0,0]
        )).attr({
            stroke: "red",
            'stroke-witdh': 5
        });

        _.each(commits, function(commit) {
            paper.image("https://secure.gravatar.com/avatar/" + commit.gravatar,
                commit.time * cell.x + offset.x,
                commit.space * cell.y + offset.y,
                10, 10
            );
        });
    };

    // Utils
    var createPath = function() {
        return _(arguments).chain()
            .map(function(move) {
                return [ move[0], move[1] + "," + move[2] ];
            }).flatten().value().join('');
    };

    $(document).ready(function() {
        $.getJSON('ajax/mrt.json', function(data) {
            render(data.commits);        
        });
    });

}(jQuery))
