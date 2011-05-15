var express = require('express'),
    https = require('https');

var app = express.createServer();

// Configuration
app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
});

app.configure('development', function() {
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
    var oneYear = 31557600000;
    app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
    app.use(express.errorHandler());
});

app.get('/static/*', function(req, res) {
    res.sendfile(__dirname + '/public/' + req.params[0]);
});

app.get('/:user/:repo', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
});

// GitHub proxy
app.get('/proxy', function(request, response) {
    response.contentType('application/json');

    var path = request.url.substring(12);
    console.log('Making request to GitHub: %s', path);

    https.get({ host: 'github.com', path: path }, function(res) {
        console.log('GitHub replied with status code: %s', res.statusCode);

        res.on('data', function(data) {
            response.write(data);
        }).on('end', function() {
            response.end();
        });

    }).on('error', function(e) {
        console.log('Got error from GitHub: %s', e.message);
    });

});

app.listen(process.env.PORT || 8000);
console.log('Express server started on port %s', app.address().port);
