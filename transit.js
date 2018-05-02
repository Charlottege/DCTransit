var request = require('request');
var moment = require('moment');


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
  var stopId = req.query.stopId;
  var date = req.query.date;
  var startTime = date + "T" + req.query.startTime;
  var endTime = date + "T" + req.query.endTime;

  var url = 'https://api.wmata.com/Bus.svc/json/jStopSchedule?StopID='+stopId+'&Date='+date;
  var headers = {
    'api_key': 'b2cfdaf549384639abd1681a80fc7aeb'
  };

  var result = {};

  request({ url: url, headers: headers, json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    result = processResponse(body, startTime, endTime);
    //response.json(result)
    var html = "<!DOCTYPE html><html><body><h1>Washington Metropolitan Area Transit Authority Search Result</h1>";
    html += "<p>StartTime: " + startTime+ "</p>";
    html += "<p>EndTime: " + endTime + "</p>";
    html += "<p>StopID: " + result.stop.StopID + "</p>";
    html += "<p>StopName: " + result.stop.Name + "</p>";

    //routes
    html += "<p>All Routes: ";
    var routes = result.stop.Routes;
    var stop_route = [];
    if (routes && routes.length > 0) {
      for (var i = 0; i < routes.length; i++) {
        stop_route[i]={'routeID' : routes[i], 'stopID' : result.stop.StopID};
        html += routes[i] + ", ";
      }
    } else {
      html += "0 Route";
    }
    html += "</p>";

    // filter routes
    html += "<p>Routes Wanted: " + stop_route[1] + "</p>";


    //Search Result
    html += "<p>Search Result Count: " + result.searchResultCount + "</p>";
    
    var searchResult = result.searchResult;
    if (searchResult && searchResult.length > 0) {
      html += "<table><tr><th>ScheduleTime</th><th>RouteID</th><th>TripID</th><th>TripHeadsign</th></tr>";
      for (var j = 0; j < searchResult.length; j++) {
        html += "<tr><td>" + searchResult[j].ScheduleTime + "</td>";
        html += "<td>" + searchResult[j].RouteID + "</td>";
        html += "<td>" + searchResult[j].TripID + "</td>";
        html += "<td>" + searchResult[j].TripHeadsign + "</td></tr>";
      }
    }
    html += "</table>";    

    html += "</body></html>";

    response.send(html)
  });

})




app.listen(3000)
