(function($, undefined) {

    var months = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG',
        'SEP', 'OCT', 'NOV', 'DEC'
    ];

    var dimensions = {
        header: { h: 30 },
        padding: { w: 2, h: 1.75 },
        avatar: { w: 15, h: 15 },
        arrow: { w: 4, h: 10 },
        borderRadius: 5
    };
    _.extend(dimensions, {
        offset: { x: 10, y: 10 + dimensions.header.h },
        cell: {
            w: dimensions.avatar.w * dimensions.padding.w,
            h: dimensions.avatar.h * dimensions.padding.h
        },
        day: { h: dimensions.header.h * 3 / 7 },
        month: { h: dimensions.header.h * 5 / 7 }
    });

    var styles = {
        hiddenOpacity: 0,
        background: { fill: '#F2F2F2', stroke: 'none' },
        header: { fill: '#CCC', stroke: 'none' },
        frame: { stroke: '#BBB', 'stroke-width': 1 },
        day: { fill: 'black', font: '12px Arial', 'font-weight': 'bold' },
        month: { fill: 'black', font: '6px Arial' }
    };
    styles.branchStyles = util.createBranchStyles(1000);

    var animations = {
        timeUnit: 200,
        speed: 1,
        delta: 1.5,
        duration: function() {
            return this.timeUnit / this.speed;
        },
        faster: function(factor) {
            this.speed = this.speed * this.delta;
        },
        slower: function(factor) {
            this.speed = this.speed / this.delta;
        }
    };

    var camera = { x: 0, y: 0 };

    // Sets
    var world, avatars, branches, dates, visible = [];

    // GitHub data
    var repo = {};


    var renderBackdrop = function() {
        var paper = Raphael('canvas', dimensions.canvas.w, dimensions.canvas.h);

        world = paper.set(),
        world.push(
            avatars = paper.set(),
            branches = paper.set(),
            dates = paper.set()
        );

        // Cavas background
        var background = paper.rect(0, 0, dimensions.canvas.w, dimensions.canvas.h)
            .attr(styles.background);

        // Dates header
        var header = paper.rect(0, 0, dimensions.canvas.w, dimensions.header.h)
            .attr(styles.header);

        // Frame
        var frame = paper.path(createPath(
            ['M', 0, 0],
            ['L', dimensions.canvas.w, 0], ['L', dimensions.canvas.w, dimensions.canvas.h],
            ['L', 0, dimensions.canvas.h], ['L', 0, 0]
        )).attr(styles.frame);

        return paper;
    };

    var animate = function(paper, context) {
        animate.running = true;
        animate.paused = false;
        animate.callback = function() {
            context.idx += 1;
            animate(paper, context);
        };

        var commit = context.commits[context.idx];
        if (!commit) {
            animate.running = false;
            return;
        }

        processCommit(paper, commit, context);
        visible.push(commit);

        _.each(commit.parents, function(parent) {
            parent.connection.animate({
                'stroke-opacity': 1
            }, animations.duration());
        });

        commit.avatar.animate({
            opacity: 1
        }, animations.duration(), function() {
            moveCamera(dimensions.cell.w);
            moveViewport(function() {
                if (!animate.paused) {
                    animate.callback();
                }
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
                    .attr(styles.branchStyles[branchSpace]);

                // Parent avatar to front
                context.commits[parent.time].avatar.toFront();

                branches.push(parent.connection);
            });
        }
        // Draw avatar
        commit.avatar = paper.image(info.image, info.x, info.y, info.w, info.h)
            .attr({ opacity: styles.hiddenOpacity });
        avatars.push(commit.avatar);

        // Draw date if it changed
        var cd = new Date(commit.date);
        cd = new Date(cd.getFullYear(), cd.getMonth(), cd.getDate());
        if (!context.currentDate || cd > context.currentDate) {
            context.currentDate = cd;
            drawDate(context.currentDate, info.cx, commit.time, paper);
        }
    };

    var render = function(paper, commits) {
        moveCamera(commits[0].time * dimensions.cell.w - dimensions.canvas.w / 2);
        animate(paper, {
            idx: 0,
            commits: commits,
            currentDate: null
        });
    };

    var moveCamera = function(delta, callback) {
        camera.x += delta;
        if (!animate.running || animate.paused) {
            moveViewport(callback);
        }
    };

    var moveViewport = function(callback) {
        var delta = camera.x - moveViewport.camera || 0;
        moveViewport.camera = camera.x;

        world.translate(-delta, 0);

        var minTime = (camera.x - 10) / dimensions.cell.w;
        var maxTime = minTime + dimensions.canvas.w / dimensions.cell.w;

        _.each(visible, function(commit) {
            var notVisible = commit.time < minTime || commit.time > maxTime;
            if(notVisible) {
                if(commit.avatar) { commit.avatar.remove(); }
                _.each(commit.parents, function(parent) {
                    parent.connection.remove(); 
                });
            }
        });

        if (callback) { callback(); }
    };

    // Commit utils
    var commitInfo = function(commit) {
        var info = {
            image: 'https://secure.gravatar.com/avatar/' + commit.gravatar,
            x: commit.time * dimensions.cell.w + dimensions.offset.x - camera.x,
            y: commit.space * dimensions.cell.h + dimensions.offset.y,
            w: dimensions.avatar.w,
            h: dimensions.avatar.h
        };
        info.cx = info.x + dimensions.avatar.w / 2;
        info.cy = info.y + dimensions.avatar.h / 2;
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
            ['L', px, cy + dimensions.borderRadius * upDown],
            ['S', px, cy, px + dimensions.borderRadius, cy],
            ['L', cx, cy]
        ];
    };

    var mergePath = function(px, py, cx, cy, upDown) {
        return [
            ['L', cx - dimensions.borderRadius, py],
            ['S', cx, py, cx, py + dimensions.borderRadius * upDown],
            ['L', cx, cy]
        ];
    };

    var arrowPath = function(x, y, upDown) {
        var result = [];
        // Horizontal
        if (_.isUndefined(upDown)) {
            result.push(
                ['M', x, y, x - dimensions.arrow.h, y - dimensions.arrow.w / 2,
                    x - dimensions.arrow.h, y + dimensions.arrow.w / 2],
                ['Z']
            );

        // Vertical
        } else {
            result.push(
                ['M', x, y + dimensions.avatar.h / 2 * upDown,
                    x - dimensions.arrow.w / 2, y +
                        (dimensions.avatar.h / 2 + dimensions.arrow.h) * upDown,
                    x + dimensions.arrow.w / 2, y +
                        (dimensions.avatar.h / 2 + dimensions.arrow.h) * upDown],
                ['Z']
            );
        }
        return result;
    };

    var drawDate = function(date, x, time, paper) {
        var day = paper.text(
            x, dimensions.day.h, date.getDate()
        ).attr(styles.day);
        dates.push(day);

        var month = paper.text(
            x, dimensions.month.h, months[date.getMonth()]
        ).attr(styles.month);
        dates.push(month);

        visible.push({
            time: time,
            parents: [
                { connection: day },
                { connection: month },
            ]
        });
    };

    // UI related functions

    var initCanvas = function() {
        var $canvas = $('#canvas');
        dimensions.canvas = {
            w: $canvas.width(),
            h: $(window).height() - $('body').height() -
                parseInt($canvas.css('paddingTop').replace('px', ''), 10)
        };
    };

    var initRepoControls = function() {
        $('.input_param').focusin(function(e) {
            e.preventDefault();
            if ($(this).val() === 'user/repo') {
                $(this).val('');
            }
        });
        $('.input_param').focusout(function(e) {
            e.preventDefault();
            if ($(this).val() === '') {
                $(this).val('user/repo');
            }
        });
        // Get commit history
        $('#play').click(function(e) {
            e.preventDefault();
            repo.url = $('#repo').val();

            if (repo.url && repo.url.length > 0) {
                $.getJSON('proxy?path=/' + repo.url + '/network_meta', function(meta) {
                    repo.meta = meta;
                    startAnimation(repo.url, repo.meta.nethash, repo.meta.dates.length - 1);
                });
            }
        });
    };

    var startAnimation = function(url, nethash, numCommits) {
        // TODO: do this in chunks
        $.getJSON('proxy?path=/' + url + '/network_data_chunk?nethash=' +
                  nethash + '&start=0&end=' + numCommits, function(chunk) {
            render(renderBackdrop(), chunk.commits);
        });
    };

    var controls = {
        moveLeft: function() {
            moveCamera(-dimensions.cell.w * 2);
        },
        moveRight: function() {
            moveCamera(dimensions.cell.w * 2);
        },
        togglePlay: function() {
            if (animate.paused) {
                animate.callback();
            } else {
                animate.paused = true;
            }
        }
    };

    var initKeyboardControls = function() {
        $(document).bind('keydown', function(e) {
            var key = e.keyCode || e.which;
            // Left
            if (key == '37') {
                controls.moveLeft();
            }
            // Right
            else if (key == '39') {
                controls.moveRight();
            }
            // Increase speed (plus)
            else if ((key == '107' || key == '187') && animate.running) {
                animations.faster();
            }
            // Decrease speed (minus)
            else if ((key == '109' || key == '189') && animate.running) {
                animations.slower();
            }
            // Play / Pause
            else if (key == '32' && animate.running) {
                controls.togglePlay();
            }
        });
    };

    var resetTimeout = function($element, key) {
        key = key || 'timeoutId';
        if (!_.isUndefined($element.data(key))) {
            clearTimeout($element.data(key));
            $element.data(key, undefined);
        }
    };

    var initToolbarControls = function() {
        var $playbackControls = $('#playback_controls').slideUp('slow');
        $playbackControls.mouseleave(function() {
            $playbackControls.data('timeoutId', setTimeout(function() {
                $playbackControls.slideUp('slow');
            }, 1000));
        });
        $playbackControls.mouseenter(function() {
            resetTimeout($playbackControls);
        });
        $('#bottom_edge').mouseenter(function() {
            resetTimeout($playbackControls);
            $playbackControls.slideDown('slow');
        });

        $('#pause').click(function(e) {
            e.preventDefault();
            if (animate.running) {
                controls.togglePlay();
                var $this = $(this);
                $this.val() === 'Pause' ? $this.val('Play') : $this.val('Pause');
            }
        });
        $('#rewind').click(function(e) {
            e.preventDefault();
            controls.moveLeft();
        });
        $('#forward').click(function(e) {
            e.preventDefault();
            controls.moveRight();
        });
        $('#slower').click(function(e) {
            e.preventDefault();
            animations.slower();
        });
        $('#faster').click(function(e) {
            e.preventDefault();
            animations.faster();
        });
    };

    $(document).ready(function() {
        initCanvas();
        initRepoControls();
        initKeyboardControls();
        initToolbarControls();
    });

}(jQuery));
