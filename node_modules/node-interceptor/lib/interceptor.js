var http = require('http'),
	https = require('https'),
	events = require('events'),
	util = require('util'),
	deepEqual = require('deep-equal'),
	nodeunit = require('nodeunit');

/**
 * Interceptor class definition
 */
var Interceptor = module.exports = function(protocol) {
	var self = this;
	this.rules = [];
	this.static.setup(protocol);
};

/***** Private area *****/

var static = Interceptor;
var proto = Interceptor.prototype;
proto.static = static;

// Is a given variable an object?
function isObject(obj) {
	return obj === Object(obj);
};

// Is a given variable a function?
function isFunction(obj) {
	return typeof obj === "function";
}

/***** Static area *****/

static.defaults = {
	response: {
		headers: {'Content-Type': 'application/json'},
		statusCode: 200,
		body: ''
	},
	ignored: ["headers"]
};

/**
 * Gets the default response values
 * @returns {Object} default response values
 */
static.getDefaults = function() {
	return this.defaults;
};

/**
 * Adds the default response values (header, status code or body) or ignored fields.
 * @param {Object} object with defaults
 */
static.setDefaults = function(defaults) {
	this.defaults = defaults;
};

/**
 * Adds the default response values (header, status code or body) or ignored fields.
 * @param {Object} object with defaults
 */
static.addDefaults = function(defaults) {
	var d = this.defaults;
	var resp = defaults.response;
	for (var prop in resp) {
		d.response[prop] = resp[prop];
	}
	var ignored = defaults.ignored || [];
	ignored.forEach(function(prop) {
		if(d.ignored.indexOf(prop) === -1) {
			d.ignored.push(prop);
		}
	});
};

/**
 * Matches the interception rule to be used for incoming request
 * @param {Array} the current rules set
 * @param {Object} reqOptions the incoming request options
 * @param {Array} defIgnored the default ignored attributes list
 * @returns {Object} matched rule if any, undefined otherwise
 */
static.match = function(rules, reqOptions, defIgnored) {
	var matchedRule;
	rules.some(function(rule) {
		var keys = Object.keys(rule.test),
			match = false,
			found = true,
			ignored = rule.ignored.concat(defIgnored);
		keys.every(function(key) {
			// Break the loop if one of the elements is not matched
			if (!found) return false;
			// The key is ignored if not found in request options or exists in ignored list
			if(reqOptions[key] && ignored.indexOf(key) === -1) {
				if(util.isRegExp(rule[key])){
					match = rule[key].test(reqOptions[key]);
				// Currently relevant only for request headers (if they are not ignored)
				} else if (isObject(reqOptions[key])) {
					match = deepEqual(reqOptions[key], rule[key]);
				} else {
					match = reqOptions[key] == rule.test[key];
				}
				found = found && match;
			}
			return true;
		});
		if(found){
			matchedRule = rule;
			return true;
		}
	});
	return matchedRule;
};

/**
 * Setup the protocol object to be used with interceptor.
 *
 * @param {Object} protocol HTTP or HTTPS object
 * @returns {Object} the request end callback
 */
static.setup = function(protocol) {
	// wrap the protocol.request function with interceptor
	var originalRequest = protocol.request;
	protocol.request = function(options, callback){
		var rule = static.match(this.Interceptor.rules, options, static.defaults.ignored);
		if(rule){
			var res = new events.EventEmitter();
			res.headers = rule.response.headers || static.defaults.response.headers;
			res.statusCode = rule.response.statusCode || static.defaults.response.statusCode;
			return {
				end: function() {
					callback(res);
					res.emit('data', rule.response.body || static.defaults.response.body);
					res.emit('end');
				} 
			};
		} else {
			return originalRequest.call(protocol, options, callback);
		}
	};
};

/***** Prototype functions *****/

/**
 * Registers a new interception rule.
 *
 * @param {Object}
 * 		rule the object that should contain at least the test sub-object
 *		|
 *		|-> test should contain attributes for interception matching.
 *		|-> [response={}] Optional response object
 *		|-> [ignored=[]] Optional contains the attributes that should be ignored
 */
proto.register = function(rule){
	if(rule) {
		if (!isObject(rule.test)) throw "Failed to register invalid rule!";
		rule.response = rule.response || {};
		rule.ignored = rule.ignored || [];
		this.rules.push(rule);
	}
};

/**
 * Registers a list of interception rule.
 *
 * @param {Array} rules array of rule objects
 */
proto.registerAll = function(rules){
	rules.forEach(this.register, this);
};

/**
 * Registers a list of interception rules.
 *
 * @param {Array} rules array of rule objects
 */
proto.unregister = function(options){
	this.rules = this.rules.filter(function(rule){
		var equal = true;
		Object.keys(rule.test).every(function(prop) {
			if(rule.test[prop] != options.test[prop]){
				return (equal = false);
			}
			return true;
		});
		return (!equal);
	});
};

/**
 * Unregisters all the interception rules.
 */
proto.unregisterAll = proto.clear = function(){
	this.rules = [];
};
