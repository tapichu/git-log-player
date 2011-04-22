(function($, undefined) {

    var avatar = {
        url: 'https://secure.gravatar.com/avatar/',
        w: 15,
        h: 15
    };
    var padding = 2;
    var canvas = { x: 1200, y: 700 };
    var offset = { x: 10, y: 10 };
    var borderRadio = 5;

    var world;
    var avatars;
    var branches;

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
        world = paper.set(),
        world.push(
            avatars = paper.set(),
            branches = paper.set()
        );

        var frame = paper.path(createPath(
            ['M', 0, 0],
            ['L', canvas.x, 0], ['L', canvas.x, canvas.y],
            ['L', 0, canvas.y], ['L', 0, 0]
        )).attr({
            stroke: 'red',
            'stroke-witdh': 5
        });

        _.each(commits, function(commit) {
            // Draw path
            if (commit.parents.length > 0) {
                var info = commitInfo(commit);
                _.each(commit.parents, function(parent) {

                    var pInfo = commitInfo({
                        id: parent[0],
                        time: parent[1],
                        space: parent[2],
                    });

                    var path = [['M', pInfo.cx, pInfo.cy]];

                    // first commit on new branch
                    if (commit.parents.length === 1 && commit.space !== parent[2]) {
                        var radio = borderRadio;
                        if(commit.space > parent[2]) {
                            radio = -borderRadio;
                        }

                        path.push(
                            ['L', pInfo.cx, info.cy + radio], 
                            ['S', pInfo.cx, info.cy, pInfo.cx + borderRadio, info.cy],
                            ['L', info.cx, info.cy]
                        );

                    // merge into parent branch
                    } else if (commit.space !== parent[2]) {
                        var radio = borderRadio;
                        if(commit.space < parent[2]) {
                            radio = -borderRadio;
                        }
                        path.push(
                            ['L', info.cx - borderRadio, pInfo.cy], 
                            ['S', info.cx, pInfo.cy, info.cx, pInfo.cy + radio],
                            ['L', info.cx, info.cy]
                        );

                    // just another commit on same branch
                    } else {
                        path.push(['L', info.cx, info.cy]);
                    }
 
                    branches.push(paper.path(createPath.apply(null, path))
                        .attr(branchColor[commit.space]));
                });
            }
            // Draw avatar
            avatars.push(paper.image(info.image, info.x, info.y, info.w, info.h));
        });

        avatars.toFront();
        moveViewport(-commits[0].time * avatar.w * padding);
    };

    var moveViewport = function(offset) {
        //world.animate({ x: offset }, 1000);
        world.translate(offset, 0);
    };

    // Commit utils
    var commitInfo = function(commit) {
        var info = {
            image: avatar.url + commit.gravatar,
            x: commit.time * avatar.w * padding + offset.x,
            y: commit.space * avatar.h * padding + offset.y,
            w: avatar.w,
            h: avatar.h
        };
        info.cx = info.x + avatar.w / 2;
        info.cy = info.y + avatar.h / 2;
        return info;
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
