var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var propertyPageUrl = '';
var ownerName = '';
var propertySearchPageURL="http://www.miamidade.gov/propertysearch/#/";
var propertySearchRequestURL="http://www.miamidade.gov/PApublicServiceProxy/PaServicesProxy.ashx?Operation=GetAddress&clientAppName=PropertySearch&from=1&myAddress=6515+Collins+AVE&myUnit=1406&to=200";

console.log("About to initialize app");
app.get('/scrape', function(req, res){

    request.get({
      	url: propertySearchPageURL,
      	jar: true,
      	followAllRedirects: true
      }, function(error, response, html){

        // First we'll check to make sure no errors occurred when making the request

        if(!error){
            console.log("Property Search page requested successfully\n");

            var $ = cheerio.load(html);
            console.log(html);
            console.log("\nProperty Search page load complete");
            
            request.get({
              	url: propertySearchRequestURL,
              	jar: true,
              	followAllRedirects: true
              }, function(error, response, html) {
                
                if (!error) {
                    
                    console.log("Property Search request succeeded\n");
                    console.log("Request headers="+ request.headers);
        
                    var $ = cheerio.load(html);
                    console.log("\nProperty Search load complete");
                    console.log(html);
                    
                    // var ownerNameString = $('strong').filter(function() {
                    //     return $(this).text().trim() === 'Owner';
                    // }).next().children().first().children().first().text().toString();
                    // console.log("ownerNameString=" + ownerNameString);
                    // var startChar = ownerNameString.indexOf('"', 0);
                    // var endChar = ownerNameString.indexOf('"', startChar + 1);
                    // ownerName = ownerNameString.subString(startChar+1, endChar+1).trim();
                }
            })
            
            
        }
        else {
            console.log("Request Error:" + error);
        }
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end(ownerName.toString());
    })
})

app.listen(process.env.PORT)
console.log('Magic happens on port ' + process.env.PORT);
exports = module.exports = app;