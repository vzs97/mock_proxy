//hello page using www.baidu.com

var url = require('url')
    , http = require('http')
    , https = require('https')
    , httpProxy = require('http-proxy')
    ;

var PORT = process.argv[2] || 9000;

var server = http.createServer(function(req, res) {
    var options = url.parse(req.url);
    options.headers = req.headers;
    delete options.headers['accept-encoding'];
    options.method = req.method;
    if (needGetFromLocal(options.host)) {
        res.setHeader('Content-Type', 'application/json');
        res.write('{"name":"Ben"}');
        res.end();
    } else if ("capi.coupang.com" == options.host){
        var body = [];
        log("requesting " + req.url);
        var connector = (options.protocol == 'https:' ? https : http).request(options, function(serverResponse) {
                serverResponse.on('data', function(chunk) {
                    body.push(chunk);
                }).on('end', function() {
                    log(body.toString());
                });
                serverResponse.pipe(res, {end:true});
        });
        req.pipe(connector, {end:true});
    } else {
        var connector = (options.protocol == 'https:' ? https : http).request(options, function(serverResponse) {
            res.writeHeader(serverResponse.statusCode, serverResponse.headers);
            serverResponse.pipe(res, {end:true});
        });
        req.pipe(connector, {end:true});
    }
});

function writeToFile(body) {
    var fs = require('fs');
    fs.writeFile("/Users/byao/Ben/TEMP/benMock.json", body , function(err) {
        if(err) {
            return console.log(err);
        }

        log("The file was saved!");
    });
}

function needGetFromLocal(host) {
    return host == "www.baidu.com";
}

function log(log) {
    console.log(log);
}

console.log('Listening on http://localhost:%s...', PORT);
server.listen(PORT);
