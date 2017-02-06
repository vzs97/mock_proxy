var httpProxy = require('http-proxy'),
	url = require('url'),
	net = require('net'),
	http = require('http');

process.on('uncaughtException', logError);

function truncate(str) {
	var maxLength = 64;
	return (str.length >= maxLength ? str.substring(0,maxLength) + '...' : str);
}

function logRequest(req) {
	console.log(req.method + ' ' + truncate(req.url));
	console.log('client ip :' + (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress));
	for (var i in req.headers)
		console.log(' * ' + i + ': ' + truncate(req.headers[i]));
}

function logError(e) {
	console.warn('*** ' + e);
}

var regularProxy = httpProxy.createProxyServer({});

var server = http.createServer(function (req, res) {
  logRequest(req);
  uri = url.parse(req.url);
  regularProxy.web(req, res, {
  	target: 'http://' + req.headers.host
  });
});

server.on('connect', function(req, socket, head) {
	logRequest(req);
	// URL is in the form 'hostname:port'
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

server.listen(9000);


