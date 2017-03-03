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
var PORTForHTTPS = process.argv[3] || 9002;
var DBLink = "mongodb://localhost:27017/mockDB";
var collectionName = "test1";
var regularProxy = httpProxy.createProxyServer({});


var server = http.createServer(function(req, res) {
 //   if (req.headers.host.toString().indexOf("jsonplaceholder") == -1)
   //     return;

    var options = url.parse(req.url);
    options.headers = req.headers;
    delete options.headers['accept-encoding'];
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
        log("try to find data:"+req.url);
        findData(hostName, queryParse, function (item) {
            if (item != null) {
                writeJson(res, item);
            } else {
                log("requesting:"+req.url);
                regularProxy.web(req, res, {
                    target: 'http://' + req.headers.host
                });
                var requestData = "";
                req.on('data', function(chunk) {
                    requestData += chunk;
                }).on("end", function(){
                    log(requestData);
                    //saveToDB(hostName, queryParse, body);
                });
                var body = "";
                req.on('proxyResponse', function (_, _, proxyRes) {
                    proxyRes.on('data', function (chunk) {
                        body += chunk;
                    });
                    proxyRes.on("end", function() {
                        log("==========");
                        log(body);
                    });
                });

                //var connector = http.request(options, function(serverResponse) {
                //    serverResponse.on('data', function(chunk) {
                //        body += chunk;
                //    }).on('end', function() {
                //        saveToDB(hostName, queryParse, body);
                //        writeJson(res, body);
                //    });
                //    //serverResponse.pipe(res, {end:true});
                //});
                ////req.pipe(connector, {end:true});
                //connector.end();
            }
        });
    } else {
        var connector = http.request(options, function(serverResponse) {
            res.writeHeader(serverResponse.statusCode, serverResponse.headers);
            serverResponse.pipe(res, {end:true});
        });
        req.pipe(connector, {end:true});
    }
});

function saveToDB(hostName, doc, value) {
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
