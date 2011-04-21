(function($, undefined) {

    var avatar = {
        url: 'https://secure.gravatar.com/avatar/',
        w: 20,
        h: 20
    };
    var padding = 2;
    var canvas = { x: 1200, y: 500 };
    var offset = { x: 10, y: 10 };

    var branchColor = [
        { stroke: 'black', 'stroke-witdh': 10 },
        { stroke: 'blue', 'stroke-witdh': 10 },
        { stroke: 'green', 'stroke-witdh': 10 }
    ];

    var render = function(commits) {
        var paper = Raphael('canvas', canvas.x, canvas.y);

        var frame = paper.path(createPath(
            ['M', 0, 0],
            ['L', canvas.x, 0], ['L', canvas.x, canvas.y],
            ['L', 0, canvas.y], ['L', 0, 0]
        )).attr({
            stroke: 'red',
            'stroke-witdh': 5
        });

        _.each(commits, function(commit) {
            var info = commitInfo(commit);
            // Draw path
            if (commit.parents.length > 0) {
                _.each(commit.parents, function(parent) {
                    var pInfo = commitInfo({
                        id: parent[0],
                        time: parent[1],
                        space: parent[2],
                    });

                    paper.path(createPath(
                        ['M', pInfo.x + avatar.w / 2, pInfo.y + avatar.h / 2],
                        ['L', info.x + avatar.w / 2, info.y + avatar.h / 2]
                    )).attr(branchColor[commit.space]);
                });
            }
            // Draw avatar
            paper.image(info.image, info.x, info.y, info.w, info.h);
        });
    };

    // Commit utils
    var commitInfo = function(commit) {
        return {
            image: avatar.url + commit.gravatar,
            x: commit.time * avatar.w * padding + offset.x,
            y: commit.space * avatar.h * padding + offset.y,
            w: avatar.w,
            h: avatar.h
        };
    };

    // Drawing utils
    var createPath = function() {
        return _(arguments).chain()
            .map(function(move) {
                return [ move[0], move[1] + ',' + move[2] ];
            }).flatten().value().join('');
    };

    $(document).ready(function() {
        $.getJSON('ajax/mrt.json', function(data) {
            render(data.commits);        
        });
    });

}(jQuery))
