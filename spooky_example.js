try {
    var Spooky = require('spooky');
} catch (e) {
    var Spooky = require('../lib/spooky');
}

var spooky = new Spooky({
        child: {
            transport: 'http'
        },
        casper: {
            logLevel: 'debug',
            verbose: true,
            viewportSize: {
                width: 1920,
                height: 1080
            }
        }
    }, function (err) {
        if (err) {
            e = new Error('Failed to initialize SpookyJS');
            e.details = err;
            throw e; 
        }

        spooky.start(
            'http://www.miamidade.gov/propertysearch/#/');
        
        spooky.then(function() {
            this.sendKeys('div#address input:nth-child(1)', '6365 Collins Ave');
        });

        spooky.then(function() {
            this.sendKeys('div#address input:nth-child(2)', '1409');
        });
        
        spooky.then(function() {
            this.click('button#search_submit');
        });
        
        spooky.then(function() {
            this.wait(5000);
        });
        
        spooky.then(function() {
            this.click('div.record_folio > span');
        });
        
        spooky.then(function() {
            this.wait(5000);
        });   
        
        spooky.then(function() {
            this.capture('property_image.png', {
                top: 545,
                left: 805,
                width: 750,
                height: 570
            });
        });
        
        spooky.then(function () {
            this.emit('hello', 'Hello, from ' + this.evaluate(function () {
                return document.title;
            }));
        });
        
        spooky.run();
    });

spooky.on('error', function (e, stack) {
    console.error(e);

    if (stack) {
        console.log(stack);
    }
});


// Uncomment this block to see all of the things Casper has to say.
// There are a lot.
// He has opinions.
/*
spooky.on('console', function (line) {
    console.log(line);
});
*/

spooky.on('hello', function (greeting) {
    console.log(greeting);
});

spooky.on('log', function (log) {
    if (log.space === 'remote') {
        console.log(log.message.replace(/ \- .*/, ''));
    }
});