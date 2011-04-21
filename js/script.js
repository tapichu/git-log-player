(function($, undefined) {

    var avatar = {
        url: "https://secure.gravatar.com/avatar/",
        w: 30,
        h: 30
    };
    var padding = 2;
    var canvas = { x: 1200, y: 500 };
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
            paper.image(avatar.url + commit.gravatar,
                commit.time * avatar.w * padding + offset.x,
                commit.space * avatar.h * padding + offset.y,
                avatar.w,
                avatar.h
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
