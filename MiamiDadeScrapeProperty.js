// File: MiamiDadePropertyScrapeProperty.js
//
// This function will use Spooky to scrape the property information off
// the miami-dade county property appraiser web site
//return true if char is a number


var property = function getPropertyData (address, suite, includeImage, callback) {
   
    console.log('In getPropertyData');
    
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
            
            var selectXPath = 'xPath = function(expression) {return {type: "xpath",path: expression,toString: function() {return this.type + " selector: " + this.path;}};};';
     
            spooky.start(
                'http://www.miamidade.gov/propertysearch/#/');
            
            spooky.then([{
                myAddress: address
            }, function () {
                this.sendKeys('div#address input:nth-child(1)', myAddress);
            }]);
            
            spooky.then([{
                mySuite: suite
            }, function () {
                this.sendKeys('div#address input:nth-child(2)', mySuite);
            }]);
            
            spooky.then(function() {
                this.click('button#search_submit');
            });
             
            spooky.then(function() {
                this.waitForSelector('div.record_folio > span', function () {
                    this.click('div.record_folio > span');
                });
            });
        
            spooky.then([{x: selectXPath}, function() {
                eval(x);
                this.waitForSelector(xPath('//tr[contains(./td,\'Zoning Code\')]/td[2][contains(.,\'-\')]'));
                return;
              }
            ]);
            
            /*
            spooky.then(function() {
                this.wait(1000);
            });  
            */
            
            spooky.then([{
                getImage: includeImage
            }, 
                function () {
                    
                    function removeSpecialChars (text) {
                      var htmlSpace = '&nbsp;';
                      var htmlNewline = '\n';
                      var htmlTab = '\t'
                      do {
                          text = text.replace(htmlSpace, '');
                          text = text.replace(htmlNewline, '');
                          text = text.replace(htmlTab, '');
                          var hasSpecialChar = text.indexOf(htmlSpace) + text.indexOf(htmlNewline) + text.indexOf(htmlTab);
                      } while (hasSpecialChar > -3);
                     return text;
                    }
                    
                    var myPropertyData = {
                        subDivision: '',
                        propertyAddress: {
                            addressLine1: '',
                            addressLine2: '',
                            city: '',
                            state: '',
                            zip: ''
                        },
                        owners: [],
                        mailingAddress: {
                            addressLine1: '',
                            addressLine2: '',
                            city: '',
                            state: '',
                            zip: ''
                        },
                        bed: '',
                        fullBath: '',
                        halfBath: '',
                        squareFeet: '',
                        yearBuilt: '',
                        zoning: '',
                        image: ''
                    }
                    
                this.emit('hello', "Retrieving property data...")
                myPropertyData.subDivision = this.fetchText('table#property_info > tbody > tr:nth-child(3) > td > div'); 
                myPropertyData.propertyAddress.addressLine1 = this.fetchText('table#property_info > tbody > tr:nth-child(4) > td > div > span > div > span:nth-child(1)') + 
                    this.fetchText('table#property_info > tbody > tr:nth-child(4) > td > div > span > div > span:nth-child(2)') +
                    this.fetchText('table#property_info > tbody > tr:nth-child(4) > td > div > span > div > span:nth-child(3)') +
                    this.fetchText('table#property_info > tbody > tr:nth-child(4) > td > div > span > div > span:nth-child(4)') +
                    this.fetchText('table#property_info > tbody > tr:nth-child(4) > td > div > span > div > span:nth-child(5)') +
                    this.fetchText('table#property_info > tbody > tr:nth-child(4) > td > div > span > div > span[ng-if="address.unit"]');
                myPropertyData.propertyAddress.addressLine2 = this.fetchText('table#property_info > tbody > tr:nth-child(4) > td > div > span > div > span:nth-child(8)') + 
                    this.fetchText('table#property_info > tbody > tr:nth-child(4) > td > div > span > div > span:nth-child(9)') +
                    this.fetchText('table#property_info > tbody > tr:nth-child(4) > td > div > span > div > span:nth-child(10)');                    
                var ownerIndex = 1;
                do {
                    myPropertyData.owners.push(this.fetchText('table#property_info > tbody > tr:nth-child(5) > td > div > div:nth-child(' + ownerIndex + ') > div'));
                    ownerIndex ++;
                } while (this.exists('table#property_info > tbody > tr:nth-child(5) > td > div > div:nth-child(' + ownerIndex + ') > div'));
                var bedroomsBathrooms =  this.fetchText('table#property_info > tbody > tr:nth-child(9) > td:nth-child(2)');
                var bedroomsBathroomsArray = bedroomsBathrooms.split('/');
                myPropertyData.bed = removeSpecialChars(bedroomsBathroomsArray[0]);
                myPropertyData.fullBath = removeSpecialChars(bedroomsBathroomsArray[1]);
                myPropertyData.halfBath = removeSpecialChars(bedroomsBathroomsArray[2]);
                
                myPropertyData.squareFeet = this.fetchText('table#property_info > tbody > tr:nth-child(13) > td:nth-child(2)');
                myPropertyData.yearBuilt = this.fetchText('table#property_info > tbody > tr:nth-child(16) > td:nth-child(2)');
                myPropertyData.zoning = this.getElementAttribute('div.add-info-container > ul li:nth-child(6) > a', 'ng-href');
                if (getImage === 'true') {
                    myPropertyData.image = this.captureBase64('png', {
                        top: 545,
                        left: 805,
                        width: 750,
                        height: 570
                    });
                }
                
                this.emit('done', myPropertyData);
            }]);
            
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
    
    spooky.on('done', function (propertyData) {
        console.log('in done event');
        callback(null, propertyData);
    });
    
    spooky.on('log', function (log) {
        if (log.space === 'remote') {
            console.log(log.message.replace(/ \- .*/, ''));
        }
    });
    
}

/*
property('6365 Collins Ave', '1409', 'false', function (error, results) { 
    if (error) {
        console.log('error' + error);
    } else {
        console.log(JSON.stringify(results));
    }
    
    return;
});
*/

exports = module.exports = property;