// Simple proxy/forwarding server for when you don't want to have to add CORS during development.

// Usage: node proxy.js
//    Open browser and navigate to http://localhost:9100/[url]
//      Example: http://localhost:9100/http://www.google.com

// This is *NOT* for anything outside local development. It has zero error handling among other glaring problems.

// This started as code I grabbed from this SO question: http://stackoverflow.com/a/13472952/670023

var url = require('url')
    , http = require('http')
    , https = require('https')
    , httpProxy = require('http-proxy')
    , qs = require('querystring')
    ;

var PORT = process.argv[2] || 9000;
var regularProxy = httpProxy.createProxyServer({});

var server = http.createServer(function(req, res) {
    var options = url.parse(req.url);
    //var options = {};
    //options.host = req.host;
    //options.path = req.path;
    //options.port = req.port;
    options.headers = req.headers;
    delete options.headers['accept-encoding'];
    options.method = req.method;
    //options.agent = false;

    //options.headers['host'] = options.host;

    //req.pause();

    if (needGetFromLocal(options.host)) {
        res.setHeader('Content-Type', 'application/json');
        res.write('{"name":"Ben"}');
        res.end();
    } else if ("capi.coupang.com" == options.host){
        //regularProxy.web(req, res, {
        //    target: 'http://' + req.headers.host
        //});
        //var body2 = [];
        //req.on('data', function(chunk) {
        //    //body.push(new Buffer(chunk, "binary").toString("utf8"));
        //    body2.push(chunk);
        //    //respContent = respContent + chunk;//data is a buffer instance
        //}).on('end', function() {
        //    //var bodyString = Buffer.concat(body).toString();
        //    //var bodyString = body.join('');
        //    log(qs.parse(body2));
        //    //writeToFile(respContent);
        //});

        var body = [];
        var respContent = '' ;
        log("requesting " + req.url);

        var connector = (options.protocol == 'https:' ? https : http).request(options, function(serverResponse) {
        //var connector = http.request(options, function(serverResponse) {
                //serverResponse.pause();

                serverResponse.on('data', function(chunk) {
                    //body.push(new Buffer(chunk, "binary").toString("utf8"));
                    body.push(chunk);
                    log(chunk);
                    //respContent = respContent + chunk;//data is a buffer instance
                }).on('end', function() {
                    //var bodyString = Buffer.concat(body).toString();
                    //var bodyString = body.join('');
                    //log(qs.parse(body));
                    log(body);
                    //writeToFile(respContent);'
                    //res.writeHeader(serverResponse.statusCode, serverResponse.headers);
                    //res.write(body.toString());
                });
                //res.pipe(serverResponse, {end:true});
                serverResponse.pipe(res, {end:true});
                //serverResponse.resume();
            });
        //}
        //
        req.pipe(connector, {end:true});
        //req.resume();

        //httpRequestTest();
    } else {
        var connector = (options.protocol == 'https:' ? https : http).request(options, function(serverResponse) {
            res.writeHeader(serverResponse.statusCode, serverResponse.headers);
            serverResponse.pipe(res, {end:true});
        });
        req.pipe(connector, {end:true});
    }
});

function httpRequestTest(){
    var options = {
        host: 'capi.coupang.com',
        path: '/v3/products/11403055/brandsdp/shoppreview?bundleId=52&style=A&itemId=49172726&vendorItemId=3060261044&applyReconciliation=false'
    };

    var callback = function(response) {
        var str = '';

        //another chunk of data has been recieved, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been recieved, so we just print it out here
        response.on('end', function () {
            console.log(str);
        });
    }

    http.request(options, callback).end();
}

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
