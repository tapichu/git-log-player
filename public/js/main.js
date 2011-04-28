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
        camera.move(repo.commits[0].time * dimensions.cell.w - dimensions.canvas.w / 2);
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
            camera.move(dimensions.cell.w);
            camera.moveWorld(function() {
                if (!animate.paused) {
                    animate.callback();
                }
            });
        });
    };

    // Get repository metadata from GitHub
    var getRepoMeta = function(url) {
        $.getJSON('proxy?path=/' + url + '/network_meta', function(meta) {
            repo.meta = meta;
            startAnimation(url, meta.nethash, meta.dates.length - 1);
        });
    };

    // Get the commits from GitHub and start the animation
    var startAnimation = function(url, nethash, numCommits) {
        // TODO: do this in chunks
        $.getJSON('proxy?path=/' + url + '/network_data_chunk?nethash=' +
                  nethash + '&start=0&end=' + numCommits, function(chunk) {
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
            camera.move(-dimensions.cell.w * 2);
        },
        moveRight: function() {
            camera.move(dimensions.cell.w * 2);
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
        // TODO: trigger with <Return>
        $('#play').click(function(e) {
            e.preventDefault();
            repo = {};
            repo.url = $('#repo').val();

            if (repo.url && repo.url.length > 0) {
                getRepoMeta(repo.url);
            }
        });
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
                controls.faster();
            }
            // Decrease speed (minus)
            else if ((key == '109' || key == '189') && animate.running) {
                controls.slower();
            }
            // Play / Pause
            else if (key == '32' && animate.running) {
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
    });

}(jQuery));
