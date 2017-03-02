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
const options = {
    key: fs.readFileSync('/Users/byao/work/proxy/proxy_server/server-key.pem'),
    cert: fs.readFileSync('/Users/byao/work/proxy/proxy_server/server-crt.pem')
};
var server = https.createServer(options, function(req, res) {
    res.writeHead(200);
    res.end('hello world\n');
}).listen(PORT);

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
    callback(null);
    //MongoClient.connect(DBLink, function(err, db) {
    //    if(err) { return console.dir(err); }
    //
    //    var collection = db.collection(collectionName, function(err, collection) {});
    //    collection.findOne(doc, function(err, item) {
    //        if (item == null) {
    //            callback(null);
    //        } else {
    //            callback(item.JSON);
    //        }
    //
    //    });
    //});
}

function needGetFromLocal(host) {
    return host == "www.baidu.com";
}
//
//server.on('connect', function(req, socket, head) {
//    var parts = req.url.split(':', 2);
//    //if ( parts[0].indexOf("jsonplaceholder") == -1)
//    //    return;
//
//    log(req.url);
//    log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
//    //socket.setEncoding('utf8');
//    socket.allowHalfOpen = false;
//    var conn = net.connect(parts[1], parts[0], function() {
//        // tell the client that the connection is established
//        socket.write("HTTP/1.1 200 OK\r\n\r\n");
//        conn.pipe(socket);
//        socket.pipe(conn);
//
//        var zipgun = zlib.createGunzip();
//        //socket.pipe(zipgun);
//        var body = [];
//        var d = "";
//        socket.on('data', function(chunk){
//            body.concat(chunk);
//            //zlib.gunzip(body, function(err, dezipped) {
//            //    log("data ==== " + dezipped);
//            //    log("zip erro : " + err);
//            //    // Process the json..
//            //});
//            //
//            //zlib.gunzip(chunk, function(err, dezipped) {
//            //    log("chunk data ==== " + dezipped);
//            //    log("zip erro : " + err);
//            //    // Process the json..
//            //});
//            var ret = zlib.gunzipSync(chunk,[]);
//            log(ret);
//            //console.log(chunk.toString());
//        });
//
//        zipgun.on('error', function(error){
//           log("erro ========" + error);
//        });
//        //socket.on('finish', function() {
//        //    zlib.gunzip(body, function(err, dezipped) {
//        //        log("finish ==== " + dezipped);
//        //        // Process the json..
//        //    });
//        //});
//        //
//        //socket.on("unpipe", function(readable){
//        //    log("unpipe ========== " + readable);
//        //});
//        //
//        //socket.on("end", function(){
//        //    log("end ========== " );
//        //    zlib.gunzip(body, function(err, dezipped) {
//        //        log("end ==err== " + err);
//        //
//        //        log("end ==== " + dezipped);
//        //        // Process the json..
//        //    });
//        //});
//        //
//        //socket.on("_socketEnd", function(){
//        //    zlib.gunzip(body, function(err, dezipped) {
//        //        log("drain ==== " + dezipped);
//        //        // Process the json..
//        //    });
//        //});
//
//    });
//
//});
//
////server.on('connection', function connection(ws) {
////    ws.on('message', function incoming(message) {
////        console.log('received>>>: %s', message);
////    });
////    ws.on('data', function incoming(message) {
////        console.log('data>>>: %s', message);
////    });
////    ws.on("end", function(){
////        log(" ws end >>> ========== " );
////    });
////});
//
//log('Listening on http://localhost:' + PORT);
//server.listen(PORT);
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
