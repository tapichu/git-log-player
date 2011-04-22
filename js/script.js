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
    var arrow = { w: 4, h: 10 };

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
            var info = commitInfo(commit);
            // Draw path
            if (commit.parents.length > 0) {
                _.each(commit.parents, function(pData) {
                    var parent = {
                        id: pData[0],
                        time: pData[1],
                        space: pData[2],
                    };
                    var pInfo = commitInfo(parent);

                    var path = [['M', pInfo.cx, pInfo.cy]];
                    var direction = 1;

                    // first commit on new branch
                    if (commit.parents.length === 1 && commit.space !== parent.space) {
                        if (commit.space > parent.space) {
                            direction = -1;
                        }
                        path.push.apply(path, branchPath(pInfo.cx, pInfo.cy, info.cx, info.cy, direction));
                        // Arrow
                        path.push.apply(path, arrowPath(info.x, info.cy));

                    // merge into parent branch
                    } else if (commit.space !== parent.space) {
                        if (commit.space < parent.space) {
                            direction = -1;
                        }
                        path.push.apply(path, mergePath(pInfo.cx, pInfo.cy, info.cx, info.cy, direction));
                        // Arrow
                        path.push.apply(path, arrowPath(info.cx, info.cy, -direction));

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

    var branchPath = function(px, py, cx, cy, upDown) {
        return [
            ['L', px, cy + borderRadio * upDown],
            ['S', px, cy, px + borderRadio, cy],
            ['L', cx, cy]
        ];
    };

    var mergePath = function(px, py, cx, cy, upDown) {
        return [
            ['L', cx - borderRadio, py],
            ['S', cx, py, cx, py + borderRadio * upDown],
            ['L', cx, cy]
        ];
    };

    var arrowPath = function(x, y, upDown) {
        var result = [];
        // Horizontal
        if (_.isUndefined(upDown)) {
            result.push(
                ['M', x, y, x - arrow.h, y - arrow.w / 2, x - arrow.h, y + arrow.w / 2],
                ['Z']
            );

        // Vertical
        } else {
            result.push(
                ['M', x, y + avatar.h / 2 * upDown,
                    x - arrow.w / 2, y + (avatar.h / 2 + arrow.h) * upDown,
                    x + arrow.w / 2, y + (avatar.h / 2 + arrow.h) * upDown],
                ['Z']
            );
        }
        return result;
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
