(function($, undefined) {

    var avatar = {
        url: 'https://secure.gravatar.com/avatar/',
        w: 15,
        h: 15
    };
    var padding = { w: 2, h: 2 };
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

    // Camera
    var camera = 0;

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

    var animate = function(paper, context) {
        animate.running = true;
        var commit = context.commits[context.idx];
        if (!commit) {
            animate.running = false;
            return;
        }
        var delta = -avatar.w * padding.w;

        processCommit(paper, commit, context);

        _.each(commit.parents, function(parent) {
            parent.connection.animate({
                'stroke-opacity': 1
            }, timeUnit / speed);
        });

        commit.avatar.animate({
            opacity: 1
        }, timeUnit / speed, function() {
            moveCamera(avatar.w * padding.w);
            moveViewport(function() {
                context.idx += 1;
                animate(paper, context);
            });
        });
    };

    var processCommit = function(paper, commit, context) {
        var info = commitInfo(commit);
        // Draw path
        if (commit.parents.length > 0) {
            _.each(commit.parents, function(pData, pIdx) {
                var parent = commit.parents[pIdx] = {
                    id: pData[0],
                    time: pData[1],
                    space: pData[2],
                };
                var pInfo = commitInfo(parent, commit.time - parent.time);

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
                    .attr(branchColor[branchSpace]).toBack();

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
        if (!context.currentDate || cd > context.currentDate) {
            context.currentDate = cd;
            drawDate(context.currentDate, info.cx, paper);
        }
    };

    var render = function(paper, commits) {
        moveCamera(commits[0].time * avatar.w * padding.w - canvas.w / 2);
        animate(paper, {
            idx: 0,
            commits: commits,
            currentDate: null
        });
    };

    var moveCamera = function(delta, callback) {
        camera += delta;
        if (!animate.running) {
            moveViewport(callback);
        }
    };

    var moveViewport = function(callback) {
        var delta = camera - moveViewport.camera || 0;
        moveViewport.camera = camera;
        world.translate(-delta, 0);
        if (callback) { callback(); }
    };

    // Commit utils
    var commitInfo = function(commit) {
        var info = {
            image: avatar.url + commit.gravatar,
            x: commit.time * avatar.w * padding.w + offset.x - camera,
            y: commit.space * avatar.h * padding.h + offset.y,
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
            render(renderBackdrop(), data.commits);
        });

        $(document).bind('keydown', function(e) {
            var key = e.keyCode || e.which;
            // Left
            if (key == '37') {
                moveCamera(-avatar.w * padding.w);
            }
            // Right
            if (key == '39') {
                moveCamera(avatar.w * padding.w);
            }
            // Increase speed (plus)
            if ((key == '107' || key == '187') && animate.running) {
                speed = speed * 1.5;
            }
            // Decrease speed (minus)
            if ((key == '109' || key == '189') && animate.running) {
                speed = speed / 1.5;
            }
        });
    });

}(jQuery))
