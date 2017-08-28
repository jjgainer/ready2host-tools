// File: MiamiDadeScrapeRedfin.js
//
// This function will use Spooky to scrape the property information off
// the Redfin web site and return the leases allowed per year and minimum days 
// to lease

var rules = function getHoaRules (address, suite, callback) {
   
   console.log('Entering getHoaRules');
   
    var fullAddress;
    
    if (suite !== undefined && suite.length > 0) {
        fullAddress = address + ' Apt ' + suite + ', Miami Beach, FL';
    } else {
        fullAddress = address + ' Miami Beach, FL';
    }
    
    console.log('Using Address:' + fullAddress);
   
    try {
        var Spooky = require('spooky');
    } catch (e) {
        var Spooky = require('../lib/spooky');
    }
    
    var spooky = new Spooky({
            child: {
                transport: 'http',
                port: 8082
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
    
            var selectXPath = 'xPath = function(expression) {return {type: "xpath",path: expression,toString: function() {return this.type + " selector: " + this.path;}};};';
            
            spooky.start();
                
            spooky.userAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36');
            
            spooky.thenOpen('https://www.redfin.com');
            
            spooky.then([{
                myAddress: fullAddress
            }, function () {
                this.sendKeys('input#search-box-input', myAddress);
            }]);
            
            spooky.then(function() {
                this.click('button[data-rf-test-name=searchButton]');
            });
            
            spooky.then(function() {
                this.wait(100);
            });
            
            spooky.then(function() {
                if (this.exists('a.item-title.block:nth-child(2)')) {
                    this.click('a.item-title.block:nth-child(2)');
                }
            });            

            spooky.then([{x: selectXPath}, function() {
                eval(x);
                this.waitForSelector(xPath('//div[contains(./li,\'# of Times Leased\')]/li/span'));
                return;
              }
            ]);
            
            /*
            spooky.then(function() {
                this.waitForSelector('span[itemtype="http://schema.org/PostalAddress"].adr:nth-child(2)', function () {
                    return;
                });
            });
            */
            
            spooky.then(function() {
                var minimumLease = this.evaluate(function(){
                    var element = __utils__.getElementByXPath("//li[starts-with(.,'Minimum Days to Lease')]/span");
                    var $minimumLease = element.innerHTML;
                    return $minimumLease;
                });
                var leasesAllowed = this.evaluate(function(){
                    var element = __utils__.getElementByXPath("//li[contains(.,'# of Times Leased')]/span");
                    var $leasesAllowed = element.innerHTML;
                    return $leasesAllowed;
                });
                this.emit('done', {leasesAllowed: leasesAllowed, minimumLease: minimumLease});
            });
            
            
            spooky.run();
        });
    
    spooky.on('error', function (e, stack) {
        console.error(e);
    
        if (stack) {
            console.log(stack);
        }
        
        callback(e);
        
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
    
    spooky.on('done', function (attributes) {
        callback(null, attributes);
    });
    
    spooky.on('log', function (log) {
        if (log.space === 'remote') {
            console.log(log.message.replace(/ \- .*/, ''));
        }
    });
}
 
/*
rules('7445 Harding Ave', '213', function (error, results) {
    if (error) {
        console.log('error' + error);
    } else {
        console.log(JSON.stringify(results));
    }
    
    return;
});
*/

exports = module.exports = rules;