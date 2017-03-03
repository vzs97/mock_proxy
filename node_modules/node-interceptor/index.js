var http = require('http'),
	https = require('https'),
	util = require('util'),
	nodeunit = require('nodeunit'),
    Interceptor = require('./lib/interceptor');

http.Interceptor = new Interceptor(http);
https.Interceptor = new Interceptor(https);

var testCase = function(cases){
	var tearDown = function(cb) {
		http.Interceptor.clear();
		https.Interceptor.clear();
		cb();
	};
	if(cases.tearDown){
		var old = cases.tearDown;
		cases.tearDown = function(done) { 
			var self = this;
			tearDown.call(self, function(){
				old.call(self, done);
			});
		}
	} else {
		cases.tearDown = tearDown;
	}
	return nodeunit.testCase.call(this, cases);
};
util.inherits(testCase, nodeunit.testCase);

module.exports.testCase = testCase;
module.exports.Interceptor = Interceptor;
module.exports.fixtures = require('node-fixtures');
