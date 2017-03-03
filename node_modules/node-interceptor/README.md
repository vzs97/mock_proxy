HTTP & HTTPS request interceptor. Allows to define which fixture (JSON object) to return for each request, inspired by [jQuery.fixture][3], [thegreatape/fakeweb][1] and [ppcano/fixtures][2].

# Installation

    npm install node-interceptor

# Testing

    git clone git://github.com/dearwish/node-interceptor.git
    cd node-interceptor
    npm install
    npm test

# Examples

## 1. Registers a list of interception rules to spoof <code>HTTPS</code> requests to [Facebook Graph API][graphapi]:

### This example is using the node-fixtures module for reading JSON objects from &lt;your-app&gt;/test/fixtures/*.js or *.json.

#### Using <i>registerAll</i> which accepts an <code>Array</code> of interception rules and registers them one by one.

    // Setup the <b>Interceptor</b> on HTTP and HTTPS protocols.
    var interceptor = require('node-interceptor'),
        // Fixtures are already preloaded
        fixtures = interceptor.fixtures,
        https = require('https');

    https.Interceptor.registerAll([{ 

#### Mandatory

        // properties checked to qualify a request for interception
        test: {
            // uri can be a string or regular expression
            uri: '/' + process.env.FACEBOOK_APP_ID,
            host: 'graph.facebook.com'
        },

#### Optional (with defaults)

        // request property names to ignore
        ignored: ["headers"],

        // response properties to be returned
        response: {
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(fixtures.app),
            statusCode: 200
        }}, {

#### Using regular expression for URI matching:

        test: {
            // uri can be a regular expression (starts with "/me" in this case)
            uri: /^\/me/,
            host: 'graph.facebook.com'
        },
        response: {
            body: JSON.stringify(fixtures.me)
        }}, {

#### Using plain text as output body:

        test: {
            uri: '/you',
            host: 'graph.facebook.com'
        },
        response: {
            headers: {'Content-Type': 'text/plain'},
            body: 'Unknown API call attempt!',
            statusCode: 404
        }
    }]);

#### Using <i>```register```</i> to register a single interception rule.

    // This time an HTTP request
    var http = require('http');

    http.Interceptor.register({
        test: {
            uri: '/me/friends',
            host: 'graph.facebook.com'
        },

        ignored: ["headers"],

        response: {
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(fixtures.friends),
            statusCode: 200
        }
    });

#### Using <i>```unregister```</i> to unregister a single interception rule.

    http.Interceptor.unregister({
        // The test is required and it should match the registration rule.test
        test: {
            uri: '/me',
            host: 'graph.facebook.com'
        }
    });

#### Using <i>```unregisterAll```</i> or <i>```clear```</i> to unregister all interception rules.

    http.Interceptor.unregisterAll();

    // OR

    http.Interceptor.clear();

#### Providing a list of headers that will be compared using [```deep-equal```][deq] with the actual request headers.

    rule: {
        test: {
            headers: {'Accept': '*/*', 'Content-Type': 'application/json'}
            uri: '/me/friends',
            host: 'graph.facebook.com'
        },
     ...

#### Providing a list of custom headers that will be sent to the response.

    rule: {
        response: {
            headers: {
                'Set-Cookie': 'AuthSessId=41D3D0110BA61CB171B345F147C089BD; path=/',
                'Content-Type': 'application/json'
            }
            uri: /^\/dialog\/oauth/,
            host: 'www.facebook.com'
        },
     ...

## 2. Sets defaults for all Interceptor instances

### Default values defined in Interceptor are:

    {
        response: {
            headers: {'Content-Type': 'application/json'},
            statusCode: 200,
            body: ''
        },
        ignored: ["headers"]
    };

### API to override default values

#### Using <i>```getDefaults```</i> and <i>```setDefaults```</i> functions:

    var interceptor = require('node-interceptor'),
        Interceptor = interceptor.Interceptor,
        ...;

    var defaults = Interceptor.getDefaults();
    defaults.ignored = ["sweeties"];
    Interceptor.setDefaults(defaults);

#### Using <i>```addDefaults```</i> to add more defaults to existing ones (defaults with the same name will be replaced):

    Interceptor.addDefaults({
        response: {
            headers: {'Content-Type': 'text/html', 'Accept': "*/*"},
            statusCode: 204
        },
        ignored: ["headers", "footers"]
    });

#### node-interceptor also provides a nodeunit test case that resets the uri intercept list in between tests. See ```tests/suits/testcase.js``` for an example.

# Miscellaneous

## Change log

### version 0.0.2

- Added Interceptor class
- Both http and https have their own instance of Interceptor 
- Added status code to response
- Added ```defaults``` configuration as static + API to modify them 
- Some bug fixes

### version 0.0.1

- Initial version - forked from [node-fakeweb][1]
- Added HTTPS support
- Integrated with fixtures (using [node-fixtures][fixtures] module)
- Some bug fixes

## Future enhancements

1. Add Connect-like uri patterns mapping (i.e. "/users/:id/edit"). Currently it can be done using the regular expressions only.
2. Add fixtures integration - the response messages will be read from .js or .json file that reside in application fixtures directory. Inspired by [ppcano's fixtures][2].
3. Add dynamic fixtures similar to [jQuery.fixture][3].
4. Add configuration on initialization
    - to enable control over setup of interceptor on different protocols
    - to give the ability not to initialize the fixtures

## License

MIT

[1]: https://github.com/thegreatape/node-fakeweb
[2]: https://github.com/ppcano/fixtures
[3]: http://javascriptmvc.com/docs.html#!jQuery.fixture
[graphapi]: https://developers.facebook.com/docs/reference/api/
[fixtures]: https://github.com/dearwish/node-fixtures
[deq]: https://github.com/substack/node-deep-equal