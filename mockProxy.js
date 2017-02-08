//hello page using www.baidu.com

var url = require('url')
    , http = require('http')
    , https = require('https')
    , httpProxy = require('http-proxy')
    , queryString = require('querystring')
    , MongoClient = require('mongodb').MongoClient
    ;

var PORT = process.argv[2] || 9000;
var DBLink = "mongodb://localhost:27017/mockDB";
var collectionName = "test1";

var server = http.createServer(function(req, res) {
    var options = url.parse(req.url);
    options.headers = req.headers;
    delete options.headers['accept-encoding'];
    options.method = req.method;

    if (needGetFromLocal(options.host)) {
        res.setHeader('Content-Type', 'application/json');
        res.write('{"name":"Ben"}');
        res.end();

        var doc = {"vid":12341, "pid":334, "memberId": "xxxxx"};
        var json = {"name":"Ben"};

    } else if (options.host.indexOf("coupang.com") != -1){
        var body = [];
        log("requesting " + req.url);
        var queryParse = queryString.parse(options.query);

        findData(queryParse, function (item) {
            if (item != null) {
                res.setHeader('Content-Type', 'application/json');
                res.write(item);
                res.end();
            } else {
                var connector = (options.protocol == 'https:' ? https : http).request(options, function(serverResponse) {
                    serverResponse.on('data', function(chunk) {
                        body.push(chunk);
                    }).on('end', function() {
                        saveToDB(queryParse, body.toString());
                    });
                    serverResponse.pipe(res, {end:true});
                });
                req.pipe(connector, {end:true});
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

function log(log) {
    console.log(log);
}

console.log('Listening on http://localhost:%s...', PORT);
server.listen(PORT);
