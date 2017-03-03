/**
 * Created by byao on 3/1/17.
 */

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

httpsOpts = {
    key: fs.readFileSync('server-key.pem', 'utf8'),
    cert: fs.readFileSync('server-crt.pem', 'utf8'),
    ca: fs.readFileSync('ca-crt.pem'),
};

//
// Create the target HTTP server
//
http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.write('hello http over https\n');
    res.end();
}).listen(9009);

//
// Create the HTTPS proxy server listening on port 8000
//
httpProxy.createServer({
    target: {
        host: 'localhost',
        port: 9009
    },
    ssl: {
        key: fs.readFileSync('server-key.pem', 'utf8'),
        cert: fs.readFileSync('server-crt.pem', 'utf8'),
    }
}).listen(8009);