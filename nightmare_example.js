var express = require('express');
var fs = require('fs');
var request = require('request');
var app     = express();

const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: false
});

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

console.log("About to initialize app");
app.get('/EligibilityService', function(req, res){
    console.log('Processing request');
    nightmare
        .viewport(1024,1024)
        .useragent('Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Mobile Safari/537.36')
        .goto('https://miamidade.county-taxes.com/public')
        //.screenshot('page1.png')
        .click('div#search-controls > div.panel-body:nth-child(1) > form.search.hidden-xs:nth-child(2) > div.col-lg-8.col-lg-offset-2:nth-child(1) > div.input-group:nth-child(1) > input.search-text.form-control:nth-child(1)')
        .type('input.search-text', '6515 Collins Ave 1406')
        //.screenshot('page1_input.png')
        .click('div#search-controls > div.panel-body:nth-child(1) > form.search.hidden-xs:nth-child(2) > div.col-lg-8.col-lg-offset-2:nth-child(1) > div.input-group:nth-child(1) > span.input-group-btn:nth-child(2) > button.btn.btn-default.btn:nth-child(1) > span:nth-child(1)')
        //.screenshot('page1_results.png')
        //.click('div#results > div:nth-child(2) > div.result.col-sm-10.col-sm-offset-1:nth-child(1) > div.actions.hidden-xs:nth-child(4) > div:nth-child(1) > ul.inline-bulleted.sublinks:nth-child(2) > li:nth-child(3) > a:nth-child(1)')
        .click('ul.inline-bulleted > li > a')
        .wait('g#parcelBoundary_layer') 
        //.wait('table#property_info')
        .screenshot('page2.png')
        .evaluate(function () {
             console.log('In evaluate()');
             //return document.querySelector('table#property_info tr:nth-child(5) > td > div > div > div').value;
             //return document.querySelector('table#property_info tr:nth-child(5) > td > div > div > div').value;
             return document.querySelector('div#important-title').innerText;
        })
        .then(function (result) {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end('Result=' + result);
          console.log(result);
        })
        .catch(function (error) {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end('Error=' + error);
          console.log(error);
        });
})

app.listen(process.env.PORT);
console.log('Magic happens on port ' + process.env.PORT);
exports = module.exports = app;