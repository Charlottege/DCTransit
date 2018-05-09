var moment = require('moment');
const fs = require('fs');

//var request = require('request'); //add API request limit control
var limit = require("simple-rate-limiter");
var request = limit(require("request")).to(5).per(1500);

//delay() not used anymore
const delay = (ms) => {   const startPoint = new Date().getTime();   while (new Date().getTime() - startPoint <= ms) {/* wait */} }

var StopRouteData = fs.readFileSync('StopwithRoute.txt', 'utf8', (err, data) => {
  if (err) throw err;
 });

var Dataline = [];
var datarow = StopRouteData.split('\n');
for (var j = 0; j < datarow.length; j ++){
  if (datarow[j].length > 0 && datarow[j] !== ' ') {
    Dataline.push({'StopID' : datarow[j].replace(/[\n\r]+/g,"")});
  }
}

function processResponse(body, startTime, endTime) {
    var data = {};
    data.stop = body.Stop;
    //console.log(body.Stop);
    var arrivals = body.ScheduleArrivals;
    //console.log("Total arrival count: " + count);
    var searchResult = filterWithTimeRange(startTime, endTime, arrivals); 
    //console.log(searchResult);
    data.searchResult = searchResult;
    data.searchResultCount = searchResult.length;
    return data;
}

function filterWithTimeRange(startTime, endTime, data) {
    var start = moment(startTime);
    //console.log(startTime);
    //console.log(start);
    var end = moment(endTime);
    //console.log(endTime);
    //console.log(end);
    var searchResult = [];
    
    if (data && data.length > 0) {
         for (var i = 0; i < data.length; i++) {
         	var scheduledTime = moment(data[i].ScheduleTime);
		if (scheduledTime.diff(start) >= 0 && scheduledTime.diff(endTime) < 0) {
			//console.log(data[i]);
                    searchResult.push(data[i]);    
		}
         }
    }
    //return searchResult;
    //console.log("Total matching record is: " + searchResult.length);
    return searchResult;
}

// const express = require('express')
// const app = express()

// app.use((request, response, next) => {
//   console.log(request.headers)
//   next()
// })

// app.use((request, response, next) => {
//   request.chance = Math.random()
//   next()
// })

// app.get('/', (req, response) => {
//   //var stopId = req.query.stopId;
//   //var stopId = Dataline[1].StopID;
  

// })




// app.listen(3000)

function main() {
  var date = '2018-05-08';
  var startTime = date + 'T' + '00:00:00';
  var endTime = date + 'T' + '05:00:00';
  
  var headers = {
    'api_key': 'b2cfdaf549384639abd1681a80fc7aeb'
  };

  // var html = "<!DOCTYPE html><html><body><h1>Washington Metropolitan Area Transit Authority Search Result</h1>";
  // html += "<p>StartTime: " + startTime+ "</p>";
  // html += "<p>EndTime: " + endTime + "</p>";
  var stream = fs.createWriteStream("result.txt");
  stream.once('open', function(fd) {

    stream.write("StartTime: " + startTime + "\n");
    stream.write("EndTime: " + endTime + "\n");

    //html += "<table><tr><th>StopID</th><th>SelectedRouteID</th><th>searchResultCount</th><th>StopName</th></tr>";
    var responseCount = 0;
    for (var k = 0; k < Dataline.length; k++) {
      
        //console.log(Dataline[k]);

        var stopId = Dataline[k].StopID;
        var result = {};
        var url = 'https://api.wmata.com/Bus.svc/json/jStopSchedule?StopID='+stopId+'&Date='+date;

        request({ url: url, headers: headers, json: true }, apiCallback(k));
        function apiCallback(k) { 
          return function(err, res, body) {
            if (err) { return console.log(err); }

            responseCount++;
            console.log("Processing Stop:" + Dataline[k].StopID);
            
	    //console.log(body);
            result = processResponse(body, startTime, endTime);
            if(!result.stop) {
              console.log(body);
              return;
            }
            
            //routes
            //html += "<p>All Routes: ";
            //var routes = result.stop.Routes;
            //if (routes && routes.length > 0) {
              //for (var i = 0; i < routes.length; i++) {
                //html += routes[i] + ", ";
              //}
            //} else {
              //html += "0 Route";
            //}
            //html += "</p>";

            //Search Result
            var counter = 0;
            var searchResult = result.searchResult;
            var SelectedRoutes = [];

            
             // if this stop is the terminus for route, then add the route to array, and count how many times terminus routes stop
            //console.log(searchResult);

            if (searchResult && searchResult.length > 0) {
              for (var j = 0; j < searchResult.length; j++) {
                if (searchResult[j].ScheduleTime === searchResult[j].StartTime || searchResult[j].ScheduleTime === searchResult[j].EndTime){
                    if (!SelectedRoutes.includes(searchResult[j].RouteID)) {
                      SelectedRoutes.push(searchResult[j].RouteID);
                    }            
                  counter++;
                }
              }
              console.log("Found Terminus Route: [" + SelectedRoutes + "]"); 
             
            }
            
            // html += "<tr><td>" + result.stop.StopID +"</td>";
            // html += "<td><center>" + SelectedRoutes + "</center></td>";
            // html += "<td><center>" + counter + "</center></td>";
            // html += "<td>" + SelectedRoutes + "</td></tr>"; 

            stream.write(result.stop.StopID + " " + counter + " [" + SelectedRoutes.toString() + "] " + result.stop.Name + "\n");

            console.log("Stop " + Dataline[k].StopID + " complete.\n");

            if (responseCount == Dataline.length) {
                // html += "</table>";
                // html += "</body></html>";

                console.log("----------------------");
                console.log("All finished. " + Dataline.length + " stopIDs processed.");
                // response.send(html);
                stream.end();
            }
          } 
           
        } 

    } 
  });

}

main();

