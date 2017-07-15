var request = require('request');
var cheerio = require('cheerio');

var propertyPageUrl = '';
var propertyPagePath = '';
var ownerName = '';
var taxDomain="http://miamidade.county-taxes.com";

function parseName(name) {
    
    var firstSpaceInName = name.indexOf(' ');
    if (firstSpaceInName === 1) {
        firstSpaceInName = name.length;
    }
        
    var parsedName = {
        firstName: name.substr(0,firstSpaceInName),
        lastName: name.substr(firstSpaceInName + 1),
    }

    return parsedName;
}

function parseCityStateZip(cityStateZip) {
    
    var commaIndex = cityStateZip.indexOf(',');

    var parsedCityStateZip = {
        city: cityStateZip.substr(0,commaIndex),
        state: cityStateZip.substr(commaIndex + 2, 2),
        zip: cityStateZip.substr(commaIndex + 5)
    }

    return parsedCityStateZip;
}

var contact = function getContactInfo (url, unit, callback) {

    request(url, function(error, response, html){

        //console.log("Main page URL=" + url);
        
        if(!error) {
            //console.log("Tax URL request succeeded");

            var $ = cheerio.load(html);
            //console.log("Tax page load complete");
            
            ownerName = $('div').filter(function() {
                return $(this).attr("class") === 'account-owner';
            }).first().text().trim();
            //console.log("ownerName=" + ownerName);
            
            var linkAddress = $('div').filter(function() {
                return $(this).attr("class") === 'account-owner';
            }).next().text().trim();
            
            if (linkAddress.indexOf(unit) === -1) {
                callback({message: "Invalid match"});
                return;
            }
            
            try
            {
                propertyPagePath = $('div').filter(function() {
                    return $(this).attr("class") === 'account-owner';
                }).parent().attr("href").toString();
            }
            catch(err) {
                console.log("Unable to parse property page path" + error);
                callback(err);
                return;
            }
            
            propertyPageUrl = taxDomain + propertyPagePath;
            request(propertyPageUrl, function(error, response, html) {
                
                //console.log("Property page URL=" + propertyPageUrl);
                
                if (!error) {
                    
                    //console.log("Property URL request succeeded");
        
                    var $ = cheerio.load(html);
                    //console.log("Property page load complete");
                    //console.log(html);
                    
                    var ownerAddressString = $('dt').filter(function() {
                        return $(this).text().trim() === 'Owner';
                    }).next().text().toString();
                    
                    //console.log("ownerAddressString=" + ownerAddressString);
                    
                    var ownerAddressArray = ownerAddressString.split("\n");
                    
                    //console.log("ownerAddressArray=" + ownerAddressArray);
                    var arrayLength = ownerAddressArray.length;
                    var foundAddressLine1 = false;
                    var addressLine1 = '';
                    var cityStateZip = '';
                    for (var i = 0; i < arrayLength; i++) {
                        if ((ownerAddressArray[i].toString().charAt(0).match(/^[0-9]+$/) != null) || (ownerAddressArray[i].toString().substr(0,2) == "PO" )) {
                            foundAddressLine1 = true;
                            addressLine1 = ownerAddressArray[i];
                            if (ownerAddressArray.length > i+2) {
                                // international address
                                callback({message: 'International Address'});
                                return;
                            }
                            cityStateZip = ownerAddressArray[i + 1];
                            break;
                        }
                    }
                    
                    if (! foundAddressLine1) {
                        callback({message: 'Address not found'});
                        return;
                    }
                    
                    var parsedName = parseName(ownerName);
                    var parsedCityStateZip = parseCityStateZip(cityStateZip);
                    
                    var returnValue = {
                        unit: unit,
                        firstName: parsedName.firstName,
                        lastName: parsedName.lastName,
                        addressLine1: addressLine1,
                        city: parsedCityStateZip.city,
                        state: parsedCityStateZip.state,
                        zip: parsedCityStateZip.zip
                    }
                    
                    callback(null, returnValue);
                    return;
                }
                else {
                    console.log("second page request error:" + error);
                    callback({message: error});
                    return;
                }
            })
        }
        else {
            console.log("first page request error:" + error);
            callback({message: error});
            return;
        }
        
    })
}

exports = module.exports = contact;