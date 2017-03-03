
# Fixtures

  Tests with fixtures data as JSON.
  

## Installation

Install via npm:

    $ npm install node-fixtures

## Usage

#### The project will look for a directory named `fixtures` which must be child of your `test` directory in order to load all the fixtures (*.js or *.json files):

##### File: test\fixtures\users.json

```js
    {
        "dearwish": {
            "name": "David",
            "gender": "male"
        },
        "innaro": {
            "name": "Inna",
            "gender": "female"
        }
  }
```

#####  File: test\fixtures\relations.js

```js
    [{
        "rel": "loves",
        "from": "dearwish",
        "to": "innaro"
    },{
        "rel": "wife",
        "from": "dearwish",
        "to": "innaro"
    },{
        "rel": "husband",
        "from": "innaro",
        "to": "dearwish"
    }]
```

##### Access fixtures depending on the name you gave to your fixtures files.
 
```js
    var fx = require('node-fixtures');

    fx.users.dearwish.name;  // => "David"
    fx.relations[0].rel;     // => "loves"
    fx.users.innaro.name;    // => "Inna"
```

##### Reset the fixtures on either setup or teardown when the fixtures were modified on tests:
 
```js
    fx.reset();
```

## License

MIT
