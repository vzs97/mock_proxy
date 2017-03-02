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

var server = http.createServer(function(req, res) {
    if (req.headers.host.toString().indexOf("jsonplaceholder") == -1)
        return;

    var options = url.parse(req.url);
    options.headers = req.headers;
    delete options.headers['accept-encoding'];
    options.method = req.method;

    if (needGetFromLocal(options.host)) {
        writeJson(res,'{"name":"Ben"}');
    } else if (options.host.indexOf("coupang") != -1){
        var body = "";
        var queryParse = queryString.parse(options.query);
        queryParse["host"] = options.host;
        queryParse["path"] = options.path;
        queryParse["httpMethod"] = options.method;
        findData(queryParse, function (item) {
            if (item != null) {
                writeJson(res, item);
            } else {
                var connector = (options.protocol == 'https:' ? https : http).request(options, function(serverResponse) {
                    serverResponse.on('data', function(chunk) {
                        body += chunk;
                    }).on('end', function() {
                        saveToDB(queryParse, body);
                        writeJson(res, body);
                    });
                    //serverResponse.pipe(res, {end:true});
                }).end();
                //req.pipe(connector, {end:true});
            }
        });
    } else {
        var connector = (options.protocol == 'https:' ? https : http).request(options, function(serverResponse) {
            res.writeHeader(serverResponse.statusCode, serverResponse.headers);
            serverResponse.pipe(res, {end:true});
        });
        req.pipe(connector, {end:true});
    }
});

function saveToDB(doc, value) {
    MongoClient.connect(DBLink, function(err, db) {
        if(err) { return console.dir(err); }

        var collection = db.collection(collectionName, function(err, collection) {});
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

function findData(doc, callback) {
    MongoClient.connect(DBLink, function(err, db) {
        if(err) { return console.dir(err); }

        var collection = db.collection(collectionName, function(err, collection) {});
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
    //if ( parts[0].indexOf("jsonplaceholder") == -1)
    //    return;


    var proxySocket = new net.Socket();
    proxySocket.connect(parts[1], parts[0], function () {
            proxySocket.write(head);
            socket.write("HTTP/" + req.httpVersion + " 200 Connection established\r\n\r\n");
        }
    );

    proxySocket.on('data', function (chunk) {
        //log("proxySocket data -= " + chunk);
        zlib.gunzip(chunk, function(err, dezipped) {
            log("proxySocket data ==== " + dezipped);
            // Process the json..
        });
        socket.write(chunk);
    });

    proxySocket.on('end', function () {
        log("proxySocket end ====== -= ");
        socket.end();
    });

    proxySocket.on('error', function () {
        socket.write("HTTP/" + req.httpVersion + " 500 Connection error\r\n\r\n");
        socket.end();
    });

    socket.on('data', function (chunk) {
        //log("socket -= " + chunk);
        zlib.gunzip(chunk, function(err, dezipped) {
            log("socket data ==== " + dezipped);
            // Process the json..
        });
        proxySocket.write(chunk);
    });

    socket.on('end', function () {
        log("socket end ====== -= ");
        proxySocket.end();
    });

    socket.on('error', function () {
        proxySocket.end();
    });

});

//server.on('connection', function connection(ws) {
//    ws.on('message', function incoming(message) {
//        console.log('received>>>: %s', message);
//    });
//    ws.on('data', function incoming(message) {
//        console.log('data>>>: %s', message);
//    });
//    ws.on("end", function(){
//        log(" ws end >>> ========== " );
//    });
//});

log('Listening on http://localhost:' + PORT);
server.listen(PORT);
//
////https
//const options = {
//    key: fs.readFileSync('server-key.pem'),
//    cert: fs.readFileSync('server-crt.pem'),
//    ca: fs.readFileSync('ca-crt.pem'),
//};
//
//https.createServer(options, function(req, res){
//    res.writeHead(200);
//res.end('hello world\n');
//}).listen(PORTForHTTPS);

//common

function log(log) {
    console.log(log);
}
