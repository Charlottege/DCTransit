var request = require('request');
var moment = require('moment');
const fs = require('fs');

const delay = (ms) => {   const startPoint = new Date().getTime();   while (new Date().getTime() - startPoint <= ms) {/* wait */} }

var StopRouteData = fs.readFileSync('StopwithRoute.txt', 'utf8', (err, data) => {
  if (err) throw err;
 });

var Dataline = [];
for (var j = 0; j < StopRouteData.split('\n').length; j ++){
  Dataline.push({'StopID' : StopRouteData.split('\n')[j].split(',')[0], 'RouteID' : StopRouteData.split('\n')[j].split(',')[1].replace(/[\n\r]+/g,"")});
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
    var end = moment(endTime);
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
    return searchResult;
   // console.log("Total matching record is: " + counter);
}

const express = require('express')
const app = express()

app.use((request, response, next) => {
  console.log(request.headers)
  next()
})

app.use((request, response, next) => {
  request.chance = Math.random()
  next()
})

app.get('/', (req, response) => {
  //var stopId = req.query.stopId;
  //var stopId = Dataline[1].StopID;
  var date = req.query.date;
  var startTime = date + "T" + req.query.startTime;
  var endTime = date + "T" + req.query.endTime;
  
  var headers = {
    'api_key': 'b2cfdaf549384639abd1681a80fc7aeb'
  };

  var html = "<!DOCTYPE html><html><body><h1>Washington Metropolitan Area Transit Authority Search Result</h1>";
  html += "<p>StartTime: " + startTime+ "</p>";
  html += "<p>EndTime: " + endTime + "</p>";

  var responseCount = 0;
  for (var k = 0; k < Dataline.length; k++) {
    
      console.log(Dataline[k]);

      var stopId = Dataline[k].StopID;
      var result = {};

      var url = 'https://api.wmata.com/Bus.svc/json/jStopSchedule?StopID='+stopId+'&Date='+date;
      request({ url: url, headers: headers, json: true }, apiCallback(k));
      function apiCallback(k) {
        return function(err, res, body) {
          if (err) { return console.log(err); }
          responseCount++;
          result = processResponse(body, startTime, endTime);
          //response.json(result)
       
          html += "<p>StopID: " + result.stop.StopID + "</p>";
          html += "<p>StopName: " + result.stop.Name + "</p>";

          //routes
          html += "<p>All Routes: ";
          var routes = result.stop.Routes;
          if (routes && routes.length > 0) {
            for (var i = 0; i < routes.length; i++) {
              html += routes[i] + ", ";
            }
          } else {
            html += "0 Route";
          }
          html += "</p>";

          //selected routes
          html += "<p>Selected Routes: ";
          html += Dataline[k].RouteID;
          html += "</p>";

          //Search Result
          //html += "<p>Search Result Count: " + result.searchResultCount + "</p>";
          var counter = 0;
          var searchResult = result.searchResult;
          if (searchResult && searchResult.length > 0) {
            html += "<table><tr><th>ScheduleTime</th><th>RouteID</th><th>TripID</th><th>TripHeadsign</th></tr>";

            for (var j = 0; j < searchResult.length; j++) {
              if (searchResult[j].RouteID == Dataline[k].RouteID){
                counter++;
                html += "<tr><td>" + searchResult[j].ScheduleTime + "</td>";
                html += "<td>" + searchResult[j].RouteID + "</td>";
                html += "<td>" + searchResult[j].TripID + "</td>";
                html += "<td>" + searchResult[j].TripHeadsign + "</td></tr>";
              } 
            }
          }
          html += "</table>";

          html += "<p>Search Result Count: " + counter + "</p>";

          if (responseCount == Dataline.length) {
              html += "</body></html>";

              response.send(html);
          }
        }
      } 
    
      delay(1000);
  }  

})




app.listen(3000)

