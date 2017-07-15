// This service takes in an street number and name of an address in Miami-Dade county and a starting
// apartment number, it then loops through all of the apartment numbers on each floor and all of the
// floors in the building to get the mailing address information for each unit
//
// This service takes the following input parameters
// streetAddress - The street number and name (including and prefixes or suffixes) for the building address, use plus sign for spaces, e.g. streetAddress=6515+Collins+Ave
// startUnitNumber - The start unit number
//
// This service will increment the unit number by 1 until an error is received indicating the last unit number on the floor
// This service will increment the floor number by 1 until an error is received indicating the last floor of the building
// Example URL to invoke service: https://ready2host-jjgainer.c9users.io:8080/AddressService?streetAddress=6515+Collins+Ave&startUnitNumber=1907

var express = require('express');
var fs = require('fs');
var app     = express();
var getContact = require('./contact');
var taxUrlStart='http://miamidade.county-taxes.com/public/search?category=property_tax&search_query=';

function incrementFloor(unitNumber) {
    //console.log("In increment floor for unit number:" + unitNumber);
    var floor = 0;
    if (unitNumber.toString().length == 3) {
        floor = parseInt(unitNumber.toString().substr(0,1), 10);
    } else {
        floor = parseInt(unitNumber.toString().substr(0,2), 10);
    }
    //console.log("current floor:" + floor);
    var newFloor = floor + 1;
    if (newFloor === 13) {
        newFloor++;
    }
    
    //console.log("new floor:" + newFloor);
    var newUnitNumber = parseInt(newFloor.toString() + '01', 10);
    //console.log("new unit number:" + newUnitNumber);
    return newUnitNumber;
}  

app.get('/AddressService', function(req, res){
    // The URL we will scrape from 

    // The structure of our request call
    // The first parameter is our URL
    // The callback function takes 3 parameters, an error, response status code and the html
    var contactArray = [{
        firstName: 'First Name',
        lastName: 'Last Name',
        addressLine1: 'Address Line 1',
        city: 'City',
        state: 'State',
        zip: 'Zip'
    }];
    
    var streetAddress = req.query.streetAddress;
    var startUnitNumber = req.query.startUnitNumber;
    var taxUrl;
    var unitNotFound = false;
    var endOfFloor = false;
    var endOfBuilding = false;
    
  
   
    function getContacts(unitNumber) {
        if (! endOfBuilding) {
            
            console.log("Processing request for unit number " + unitNumber);
            taxUrl=taxUrlStart + streetAddress + "+" + unitNumber;
            //console.log("taxURL=" + taxUrl);
            getContact(taxUrl, unitNumber, function(error, returnValue) {
             
                if (!error) {
                    contactArray.push(returnValue);
                    unitNumber++;
                    unitNotFound = false;
                    endOfFloor = false;
                    endOfBuilding = false;
                    getContacts(unitNumber);
                } else {
                    if (error.message === 'International Address') {
                        unitNumber++;
                    } else if (endOfFloor) {
                        endOfBuilding = true;
                    } else if (unitNotFound) {
                        unitNumber++;
                        endOfFloor = true;
                        unitNumber=incrementFloor(unitNumber);
                    } else {
                        unitNumber++;
                        unitNotFound = true;
                    }
                    console.log(error.message);
                    getContacts(unitNumber);
                }
            });
        } else {
            var mailingList = '';
            contactArray.forEach(function (element) {
                mailingList = mailingList +
                    element.firstName + ',' +
                    element.lastName + ',' +
                    element.addressLine1 + ',' +
                    element.city + ',' +
                    element.state + ',' +
                    element.zip + '\n';
            })
            var fileName = 'output/' + streetAddress.replace(/\s/g, "_") + ".csv";
            fs.writeFile(fileName, mailingList, function(err) {
                if (err) {
                    return console.log(err);
                }
             
                console.log("File saved successfully");
            });
        }
    }
    
    console.log('Request received!');
    
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Mailing list generating for: ' + streetAddress);
    
    getContacts(startUnitNumber);

    
})

app.listen(process.env.PORT)
console.log('Magic happens on port ' + process.env.PORT);
exports = module.exports = app;