(function($, undefined) {

    var avatar = {
        url: 'https://secure.gravatar.com/avatar/',
        w: 30,
        h: 30
    };
    var padding = 2;
    var canvas = { x: 1200, y: 700 };
    var offset = { x: 10, y: 10 };
    var inflectionRadio = 0;

    var world;

    var branchColor = [];
    for (var i = 0; i < 100; i++) {
        branchColor[i] = {
            stroke: 'rgb(' +
                i * Math.random() * 100 % 255 + ',' +
                i * Math.random() * 100 % 255 + ',' +
                i * Math.random() * 100 % 255 + ')',
            'stroke-width': 2,
            'stroke-linejoin': 'round',
            'stroke-linecap': 'round'
        };
    }

    var render = function(commits) {
        var paper = Raphael('canvas', canvas.x, canvas.y);
        world = paper.set();

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

                    var line = ['L', info.x + avatar.w / 2, info.y + avatar.h / 2];
                    if (commit.parents.length === 1) {
                        // the first commit on a new branch

                        if (commit.space !== parent[2]) {
                            var radio = inflectionRadio;
                            if(commit.space > parent[2]) {
                                radio = -inflectionRadio;
                            }
                            line = ['C',
                                pInfo.x + avatar.w / 2, info.y + avatar.h / 2 + radio,  // first inflec
                                pInfo.x + avatar.w / 2 + inflectionRadio, info.y + avatar.h / 2,  // second inflec
                                info.x + avatar.w / 2, info.y + avatar.h / 2    // end point
                            ];
                        }
                    }

                    world.push(paper.path(createPath(
                        ['M', pInfo.x + avatar.w / 2, pInfo.y + avatar.h / 2],
                        line
                    )).attr(branchColor[commit.space]));
                });
            }
            // Draw avatar
            world.push(paper.image(info.image, info.x, info.y, info.w, info.h));
        });

        moveViewport(-commits[0].time * avatar.w * padding);
    };

    var moveViewport = function(offset) {
        //world.animate({ x: offset }, 1000);
        world.translate(offset, 0);
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
                return [ move[0], move.slice(1).join(',') ];
            }).flatten().value().join('');
    };

    $(document).ready(function() {
        // Get commit history
        $.getJSON('ajax/mrt.json', function(data) {
            render(data.commits);
        });

        $(document).bind('keydown', function(e) {
            var key = e.keyCode || e.which;
            // Left
            if (key == '37') {
                moveViewport(50);
            }
            // Right
            if (key == '39') {
                moveViewport(-50);
            }
        });
    });

}(jQuery))
