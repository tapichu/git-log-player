window.commits = (function(_, undefined) {

    var hiddenOpacity = 0,
        branchStyles = util.createBranchStyles(1000);

    var commitInfo = function(commit) {
        var info = {
            image: 'https://secure.gravatar.com/avatar/' + commit.gravatar,
            x: commit.time * dimensions.cell.w + dimensions.offset.x - camera.x(),
            y: commit.space * dimensions.cell.h + dimensions.offset.y,
            w: dimensions.avatar.w,
            h: dimensions.avatar.h
        };
        info.cx = info.x + dimensions.avatar.w / 2;
        info.cy = info.y + dimensions.avatar.h / 2;
        return info;
    };

    var processCommit = function(commit, context) {
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
                    path.push.apply(path, paths.branch(pInfo.cx, pInfo.cy, info.cx, info.cy, direction));
                    // Arrow
                    path.push.apply(path, paths.arrow(info.x, info.cy));

                    // merge into parent branch
                } else if (commit.space !== parent.space) {
                    if (commit.space < parent.space) {
                        direction = -1;
                    }
                    path.push.apply(path, paths.merge(pInfo.cx, pInfo.cy, info.cx, info.cy, direction));
                    // Arrow
                    path.push.apply(path, paths.arrow(info.cx, info.cy, -direction));
                    branchSpace = parent.space;

                    // just another commit on same branch
                } else {
                    path.push(['L', info.cx, info.cy]);
                }

                parent.connection = canvas.newPath(paths.create.apply(null, path))
                    .attr(branchStyles[branchSpace]);

                // Parent avatar to front
                context.commits[parent.time].avatar.toFront();

                canvas.addBranch(parent.connection);
            });
        }
        // Draw avatar
        commit.avatar = canvas.newImage(info.image, info.x, info.y, info.w, info.h)
            .attr({ opacity: hiddenOpacity });
        canvas.addAvatar(commit.avatar);

        // Draw date if it changed
        var cd = new Date(commit.date);
        cd = new Date(cd.getFullYear(), cd.getMonth(), cd.getDate());
        if (!context.currentDate || cd > context.currentDate) {
            context.currentDate = cd;
            canvas.drawDate(context.currentDate, info.cx, commit.time);
        }
    };

    return {
        info: function(commit) {
            return commitInfo(commit);
        },
        process: function(commit, context) {
            return processCommit(commit, context);
        }
    };

})(window._);
