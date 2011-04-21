(function($, undefined) {

    var render = function(commits) {
        $('#canvas').html("<p>" + commits.length + "</p>");
    };

    $(document).ready(function() {
        $.getJSON('ajax/mrt.json', function(data) {
            render(data.commits);        
        });
    });

}(jQuery))
