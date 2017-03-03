//hello page using www.baidu.com

var url = require('url')
    , http = require('http')
    , https = require('https')
    , httpProxy = require('http-proxy')
    , queryString = require('querystring')
    , MongoClient = require('mongodb').MongoClient
    , fs = require('fs')
    , net = require('net')
    , zlib = require('zlib');
;


var PORT = process.argv[2] || 9001;
var DBLink = "mongodb://localhost:27017/mockDB";
var ignoreDB = true;
var regularProxy = httpProxy.createServer();
var temCache = {};
regularProxy.on('proxyRes', function (proxyRes, req, res) {
    log("receiveing data:"+req.url);
    var queryParse = temCache[req];
    // collect response data
    var proxyResData='';
    proxyRes.on('data', function (chunk) {
        proxyResData +=chunk;
    });
    proxyRes.on('end',function () {
        log("=============");
        log(proxyResData);
        saveToDB(queryParse["host"], queryParse, proxyResData);
    });

    //console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
});

regularProxy.on('error', function (err, req, res) {
    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });
    res.end('Proxy return error.' + req.url);
});

regularProxy.on('proxyReq', function(proxyReq, req, res, options) {
    if(req.method=="POST"&&req.body){
        proxyReq.write(req.body);
        log(req.body);
        proxyReq.end();
    }
});

var server = http.createServer(function(req, res) {
    //   if (req.headers.host.toString().indexOf("jsonplaceholder") == -1)
    //     return;

    var options = url.parse(req.url);
    options.headers = req.headers;
    //delete options.headers['accept-encoding'];
    options.method = req.method;

    //if (needGetFromLocal(options.host)) {
    //    writeJson(res,'{"name":"Ben"}');
    //} else if (options.host.indexOf("coupang") != -1){
    if (options.host.indexOf("metric") == -1){
        var queryParse = queryString.parse(options.query);
        var hostName = options.host;
        queryParse["host"] = hostName;
        queryParse["path"] = options.path;
        queryParse["httpMethod"] = options.method;
        var requestData = "";
        //regularProxy.web(req, res, {
        //    target: 'http://' + req.headers.host
        //});
        var bodyData = JSON.stringify(req.body);
        log("log(buffer) === " + bodyData);
        req.on('data', function(chunk) {
            requestData += chunk;
        }).on("end", function(){

            log(requestData);
            queryParse["queryData"] = requestData;
            findData(hostName, queryParse, function (item) {
                if (item != null) {
                    //writeJson(res, item);
                } else {
                    var headers = {};
                    if(req.method=="POST" && req.body){
                        var data = JSON.stringify(req.body);
                        req.body = data;
                        headers = {
                            "Content-Type": "application/json",
                            "Content-Length": data.length
                        }
                    }
                    regularProxy.web(req, res, {target: req.url, secure: false});
                    temCache[req] = queryParse;
                    log(queryParse["httpMethod"] + " : "+'http://' + req.headers.host);
                    //regularProxy.web(req, res, {target: req.url, secure: false});


                    //
                    //var body = "";
                    //req.on('proxyResponse', function (_, _, proxyRes) {
                    //    proxyRes.on('data', function (chunk) {
                    //        body += chunk;
                    //    });
                    //    proxyRes.on("end", function() {
                    //        log("==========");
                    //        log(body);
                    //    });
                    //});
                }
            });
        });
        //setTimeout(function(){
        //    regularProxy.web(req, res, {target: req.url, secure: false});
        //}, 500);

    } else {
        var connector = http.request(options, function(serverResponse) {
            res.writeHeader(serverResponse.statusCode, serverResponse.headers);
            serverResponse.pipe(res, {end:true});
        });
        req.pipe(connector, {end:true});
    }
});

function saveToDB(hostName, doc, value) {
    if (ignoreDB) {
        return;
    }
    MongoClient.connect(DBLink, function(err, db) {
        if(err) { return console.dir(err); }

        var collection = db.collection(hostName, function(err, collection) {});
        collection.findOne(doc, function(err, item) {
            if (item == null) {
                doc["JSON"] = value;
                collection.insertOne(doc);
            } else {
                // have the record, should not update
            }

        });
    });
}

function writeJson(res, jsonString) {
    res.setHeader('Content-Type', 'application/json');
    res.write(jsonString);
    res.end();
}

function findData(hostName, doc, callback) {
    if (ignoreDB) {
        callback(null);
        return;
    }
    MongoClient.connect(DBLink, function(err, db) {
        if(err) { return console.dir(err); }

        var collection = db.collection(hostName, function(err, collection) {});
        collection.findOne(doc, function(err, item) {
            if (item == null) {
                callback(null);
            } else {
                callback(item.JSON);
            }

        });
    });
}

function needGetFromLocal(host) {
    return host == "www.baidu.com";
}

server.on('connect', function(req, socket, head) {
    var parts = req.url.split(':', 2);
    // open a TCP connection to the remote host
    var conn = net.connect(parts[1], parts[0], function() {
        // respond to the client that the connection was made
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
        // create a tunnel between the two hosts
        socket.pipe(conn);
        conn.pipe(socket);
    });

});



log('Listening on http://localhost:' + PORT);
server.listen(PORT);

function log(log) {
    console.log(log);
}
