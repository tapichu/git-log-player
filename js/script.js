(function($, undefined) {

    var avatar = {
        url: 'https://secure.gravatar.com/avatar/',
        w: 15,
        h: 15
    };
    var padding = 2;
    var headerHeight = 30;
    var canvas = { w: 820, h: 700 };
    var offset = { x: 10, y: 10 + headerHeight };
    var borderRadio = 5;
    var hiddenOpacity = 0;

    // Sets
    var world, avatars, branches, dates;

    var branchColor = [];
    for (var i = 0; i < 100; i++) {
        branchColor[i] = {
            stroke: 'rgb(' +
                i * Math.random() * 100 % 255 + ',' +
                i * Math.random() * 100 % 255 + ',' +
                i * Math.random() * 100 % 255 + ')',
            'stroke-width': 2,
            'stroke-linejoin': 'round',
            'stroke-linecap': 'round',
            'stroke-opacity': hiddenOpacity
        };
    }
    var arrow = { w: 4, h: 10 };
    var months = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG',
        'SEP', 'OCT', 'NOV', 'DEC'
    ];

    // Animations
    var timeUnit = 200;
    var speed = 1;

    var renderBackdrop = function() {
        var paper = Raphael('canvas', canvas.w, canvas.h);

        world = paper.set(),
        world.push(
            avatars = paper.set(),
            branches = paper.set(),
            dates = paper.set()
        );

        // Dates header
        var header = paper.rect(0, 0, canvas.w, headerHeight)
            .attr({ fill: '#CCC', stroke: 'none' });

        // Frame
        var frame = paper.path(createPath(
            ['M', 0, 0],
            ['L', canvas.w, 0], ['L', canvas.w, canvas.h],
            ['L', 0, canvas.h], ['L', 0, 0]
        )).attr({
            stroke: 'red',
            'stroke-witdh': 5
        });

        return paper;
    };

    var animate = function(idx, commits) {
        var commit = commits[idx];
        if(!commit) { return; }
        var delta = -avatar.w * padding;

        _.each(commit.parents, function(parent) {
            parent.connection.animate({
                'stroke-opacity': 1
            }, timeUnit / speed);
        });

        commit.avatar.animate({
            opacity: 1
        }, timeUnit / speed, function() {
            moveViewport(delta, function() {
                animate(idx + 1, commits);
            });
        });
    };

    var render = function(paper, commits, timeOffset) {
        var currentDate = null;
        _.each(commits, function(commit) {
            var info = commitInfo(commit);
            // Draw path
            if (commit.parents.length > 0) {
                _.each(commit.parents, function(pData, pIdx) {
                    var parent = commit.parents[pIdx] = {
                        id: pData[0],
                        time: pData[1],
                        space: pData[2],
                    };
                    var pInfo = commitInfo(parent);

                    var path = [['M', pInfo.cx, pInfo.cy]];
                    var direction = 1;
                    var branchSpace = commit.space;

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
                        branchSpace = parent.space;

                    // just another commit on same branch
                    } else {
                        path.push(['L', info.cx, info.cy]);
                    }

                    parent.connection = paper.path(createPath.apply(null, path))
                            .attr(branchColor[branchSpace]);

                    branches.push(parent.connection);
                });
            }
            // Draw avatar
            commit.avatar = paper.image(info.image, info.x, info.y, info.w, info.h)
                .attr({opacity: hiddenOpacity});
            avatars.push(commit.avatar);
            // Draw date if it changed
            var cd = new Date(commit.date);
            cd = new Date(cd.getFullYear(), cd.getMonth(), cd.getDate());
            if (!currentDate || cd > currentDate) {
                currentDate = cd;
                drawDate(currentDate, info.cx, paper);
            }
        });

        avatars.toFront();
        moveViewport(-commits[0].time * avatar.w * padding + canvas.w / 2);

        animate(0, commits);
    };

    var moveViewport = function(offset, callback) {
        world.translate(offset, 0);
        if (callback) { callback(); }
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

    var drawDate = function(date, x, paper) {
        var day = paper.text(
            x, headerHeight * 3 / 7, date.getDate()
        ).attr({ fill: 'black', font: '12px Arial', 'font-weight': 'bold' });
        dates.push(day);

        var month = paper.text(
            x, headerHeight * 5 / 7, months[date.getMonth()]
        ).attr({ fill: 'black', font: '6px Arial' });
        dates.push(month);
    };

    $(document).ready(function() { // Get commit history
        $.getJSON('ajax/mrt.json', function(data) {
            render(renderBackdrop(), data.commits, data.commits[0].time);
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
