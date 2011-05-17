(function($, undefined) {

    var dimensions = window.dimensions = {
        header: { h: 30 },
        padding: { w: 2, h: 1.75 },
        avatar: { w: 15, h: 15 }
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

    // GitHub data
    var repo = {};

    var render = function() {
        canvas.drawBackdrop();
        camera.reset();
        // Start drawing 4 commits to the left of the right hand side of the canvas
        camera.moveHor(repo.commits[4].time * dimensions.cell.w - dimensions.canvas.w);
        animate({ idx: 0, currentDate: null });
    };

    var animate = window.animate = function(context) {
        animate.running = true;
        animate.paused = false;
        animate.callback = function() {
            context.idx += 1;
            animate(context);
        };

        var commit = repo.commits[context.idx];
        if (!commit) {
            animate.running = false;
            return;
        }

        context.commits = repo.commits;
        commits.process(commit, context);
        canvas.addVisible(commit);

        _.each(commit.parents, function(parent) {
            parent.connection.animate({
                'stroke-opacity': 1
            }, animations.duration());
        });

        commit.avatar.animate({
            opacity: 1
        }, animations.duration(), function() {
            camera.moveHor(dimensions.cell.w);
            camera.moveWorld(function() {
                if (!animate.paused) {
                    animate.callback();
                }
            });
        });
    };

    // Get repository metadata from GitHub
    var getRepoMeta = function(url) {
        $.getJSON('/api/meta/' + url, function(meta) {
            repo.meta = meta;
            startAnimation(url, meta.nethash, meta.dates.length - 1);
        });
    };

    // Get the commits from GitHub and start the animation
    var startAnimation = function(url, nethash, numCommits) {
        // TODO: do this in chunks
        $.getJSON('/api/data/' + url + '/' + nethash + '/' + numCommits, function(chunk) {
            repo.commits = chunk.commits;
            render();
        });
    };

    var resetTimeout = function($element, key) {
        key = key || 'timeoutId';
        if (!_.isUndefined($element.data(key))) {
            clearTimeout($element.data(key));
            $element.data(key, undefined);
        }
    };

    // Control playback and the camera
    var controls = {
        moveLeft: function() {
            camera.moveHor(-dimensions.cell.w * 2);
        },
        moveRight: function() {
            camera.moveHor(dimensions.cell.w * 2);
        },
        moveUp: function() {
            camera.moveVer(-dimensions.cell.h * 2);
        },
        moveDown: function() {
            camera.moveVer(dimensions.cell.h * 2);
        },
        faster: function() {
            animations.faster();
        },
        slower: function() {
            animations.slower();
        },
        togglePlay: function() {
            if (animate.paused) {
                animate.callback();
            } else {
                animate.paused = true;
            }
        }
    };

    // UI related functions
    var initCanvas = function() {
        var $canvas = $('#canvas');
        // TODO: recalculate when window is resized
        dimensions.canvas = {
            w: $canvas.width(),
            h: $(window).height() - $('body').height() -
                parseInt($canvas.css('paddingTop').replace('px', ''), 10)
        };
    };

    var initRepoControls = function() {
        $('#repo').focusin(function(e) {
            e.preventDefault();
            if ($(this).val() === 'user/repo') {
                $(this).val('');
            }
        });
        $('#repo').focusout(function(e) {
            e.preventDefault();
            if ($(this).val() === '') {
                $(this).val('user/repo');
            }
        });
        // Get commit history
        // TODO: trigger with <Return>
        $('#play').click(function(e) {
            e.preventDefault();
            var repoUrl = $('#repo').val();

            if (util.isValidRepo(repoUrl)) {
                window.location = '/' + repoUrl;
            }
        });
    };

    var initKeyboardControls = function() {
        $(document).bind('keydown', function(e) {
            var key = e.keyCode || e.which;
            // Left
            if (key === 37) {
                controls.moveLeft();
            }
            // Up
            else if (key === 38) {
                controls.moveUp();
            }
            // Right
            else if (key === 39) {
                controls.moveRight();
            }
            // Down
            else if (key === 40) {
                controls.moveDown();
            }
            // Increase speed (plus)
            else if ((key === 107 || key === 187) && animate.running) {
                controls.faster();
            }
            // Decrease speed (minus)
            else if ((key === 109 || key === 189) && animate.running) {
                controls.slower();
            }
            // Play / Pause
            else if (key === 32 && animate.running) {
                controls.togglePlay();
            }
        });
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
            controls.slower();
        });
        $('#faster').click(function(e) {
            e.preventDefault();
            controls.faster();
        });
    };

    // Initialize
    $(document).ready(function() {
        initCanvas();
        initRepoControls();
        initKeyboardControls();
        initToolbarControls();

        // Play automatically when the URL points to a repo
        var repoUrl = $('#repo').val();
        if (util.isValidRepo(repoUrl)) {
            repo = {};
            repo.url = repoUrl;
            getRepoMeta(repo.url);
        }
    });

}(jQuery));
