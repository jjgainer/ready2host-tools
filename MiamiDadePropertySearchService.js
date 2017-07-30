// File: MiamiDadePropertySearchService.js
//
// This service takes in a street address and apartment number for a property in 
// Miami-Dade county and then does a lookup on the property appraiser web site
// to get property information.
//
// This service takes the following input parameters
// streetAddress - The street number and name (including and prefixes or suffixes) for the building address, use plus sign for spaces, e.g. streetAddress=6515+Collins+Ave
// apartment - The apartment number (optional)
//
// Example URL to invoke service: https://ready2host-jjgainer.c9users.io:8080/miamibeach/property?streetAddress=6515+Collins+Ave&apartment=1907

var express = require('express');
var fs = require('fs');
var request = require('request');
var app     = express();
var getProperty = require('./MiamiDadeScrapeProperty');
var getHoaRules = require('./MiamiDadeScrapeRedfin');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var eligibleString = 'Property is likely eligible for short-term rental due to the following reasons:';
var ineligibleString = 'Property is likely NOT eligible for short-term rental due to the following reasons:';
var errorString = 'Unable to determine eligibility for property:';

function generateResponseHtml(eligibility, propertyData, error, originalAddress) {

    console.log('in generateResponseHtml');

    var eligibilityString;
    if (error) {
        eligibilityString = errorString;
        propertyData = {
            property: {
                propertyAddress: {
                    addressLine1: originalAddress.streetAddress + 'UNIT: ' + originalAddress.apartment,
                    addressLine2: ''
                }
            }
        }
        eligibility = {
            reasons: [[]]
        }
    } else if (eligibility.eligible) {
        eligibilityString = eligibleString;
    } else {
        eligibilityString = ineligibleString;
    }
    var htmlHeader=`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml">
                    <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                    <title>Short-Term Rental Eligibility Results</title>
                    <style>
                        html *
                        {
                           font-family: Lucida Grande, Tahoma, Arial, Verdana, sans-serif;
                        }
                    </style>
                </head>
                <body>
                <h4>Property Address:</h4>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;${propertyData.property.propertyAddress.addressLine1}<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;${propertyData.property.propertyAddress.addressLine2}</p>
                <h4>${eligibilityString}</h4>
                <ul style="list-style-type:square">`
    
    var htmlReasons = '';
    eligibility.reasons.forEach(function(element) {
        htmlReasons = htmlReasons + '<li>' + element + '</li>';
    });           
                
    var htmlFooter=`</ul>
                <p><br>(Use browser back button to submit another)</p>
                </body>
                </html>`
                 
    var response = '';
    if (error) {
        response = htmlHeader + htmlFooter;
    } else {
        response = htmlHeader + htmlReasons + htmlFooter;
    }
    console.log('Response HTML:' + response);
    return response;
}
 
function determineEligibility(propertyData) {
    
    console.log('in determineEligibility');
    
    var eligible = true;
    var ineligibleReasons = [];
    var eligibleReasons = [];
    var reasons = [];
    var eligibleZones = ['CD-2','CD-3','CPS-1','CPS-2','CPS-3','CPS-4','MXE -','RM-2','RM-3','RPS-3','RPS-4',]
    
    console.log('In determineEligibility');
    
    // Check zoning
    var currentZoning = propertyData.property.zoning.substr(0,5).trim();
    if (eligibleZones.indexOf(currentZoning) > -1 ) {
        eligibleReasons.push('Property is zoned ' + currentZoning + ' which allows short-term rentals.');
    } else {
        eligible = false;
        ineligibleReasons.push('Property is zoned ' + currentZoning + ' which does not allow short-term rentals.');        
    }
    
    // Check HOA
    if (propertyData.rules.minimumLease < 180) {
        eligibleReasons.push('Homeowners association allows lease terms of less than 6 months.');
    } else {
        eligible = false;
        ineligibleReasons.push('Homeowners association does not allows lease terms of less than 6 months.');
    }
    
    if (eligible) {
        reasons = eligibleReasons;
    } else {
        reasons = ineligibleReasons;
    }
    var eligibility = {eligible, reasons};
    console.log('eligibility=' + JSON.stringify(eligibility));
    return eligibility;
} 
 

app.post('/miamibeach/property', function(req, res) {
    
    console.log("in POST for /miamibeach/property");
    
    var streetAddress = req.body.streetAddress;
    var apartment = req.body.apartment;
    var includeImage = req.body.includeImage;
    
    var includeImage = req.query.includeImage;
    if (undefined === includeImage) {
        includeImage = 'false';
    }
    
    getProperty(streetAddress, apartment, includeImage, function(error, property) {
        
        console.log("in callback for getProperty");
        var propertyData;
        
        if (!error) {
            
            getHoaRules(streetAddress, apartment, function(error, rules) {
                
                console.log("in callback for getHoaRules");
                
                if (!error) {
                    propertyData = {property, rules};
                    console.log(JSON.stringify(propertyData));
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    var eligibility = determineEligibility(propertyData);
                    res.end(generateResponseHtml(eligibility, propertyData, false, null));
                    
                } else {
                    console.log(JSON.stringify(error));
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(generateResponseHtml(null, null, true, {streetAddress, apartment}));
                }
            });
        } else {
            console.log(JSON.stringify(error));
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(generateResponseHtml(null, null, true, {streetAddress, apartment}));
        }
    });
    
})

app.get('/miamibeach/property', function(req, res) {
    
    console.log("in GET for /miamibeach/property");
    
    var streetAddress = req.query.streetAddress;
    var apartment = req.query.apartment;
    var includeImage = req.query.includeImage;
    
    if (undefined === includeImage) {
        includeImage = 'false';
    }
    
    getProperty(streetAddress, apartment, includeImage, function(error, property) {
        
        console.log("in callback for getProperty");
        var propertyData;
        
        if (!error) {
            
            getHoaRules(streetAddress, apartment, function(error, rules) {
                
                console.log("in callback for getHoaRules");
                
                if (!error) {
                    propertyData = {property, rules};
                    console.log(JSON.stringify(propertyData));
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    var eligibility = determineEligibility(propertyData);
                    res.end(generateResponseHtml(eligibility, propertyData, false, null));
                    
                } else {
                    console.log(JSON.stringify(error));
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(generateResponseHtml(null, null, true, {streetAddress, apartment}));
                }
            });
        } else {
            console.log(JSON.stringify(error));
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(generateResponseHtml(null, null, true, {streetAddress, apartment}));
        }
    });
    
})

// Default port to standard Express port, override if in Cloud9 environment
var port=3000;
if (typeof process.env.PORT !== "undefined") {
    port = process.env.PORT;
}
app.listen(port);
console.log('Service up and listening on port ' + port);
exports = module.exports = app;