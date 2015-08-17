var timesheet = require('./backend/timesheet');
var timelog = require('./backend/timelog');
var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var bodyParser = require('body-parser');
var moment = require('moment');

var mongodbUrl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/homogen';

MongoClient.connect(mongodbUrl, function(err, db){
    if(err) {
    	initApplicationWithoutDB();
    } else {
    	initApplication(db);
    }
});

//temporary method
function initApplicationWithoutDB() {
	console.log("...Without DB...");
    var app = express();
    app.set('port', process.env.PORT || 1313);
    app.use(express.static('frontend'));
    app.use(bodyParser.json());
    //run application after mongo connection
    app.listen(app.get('port'), function() {
        console.log('Homogen server is started on port: ' + app.get('port'));
    });
}

function initApplication(db) {
    var app = express();
    app.set('port', process.env.PORT || 1313);
    app.set('db', db);
    app.use(express.static('frontend'));
    app.use(bodyParser.json({reviver:parseDate}));
    
    //timesheet
    app.post('/timesheet', timesheet.save(db));
    app.get('/timesheet/:projectId', timesheet.getByProjectId(db));
    app.get('/timesheet/:projectId/calendar', timesheet.getCalendarByPeriod(db));

    //timelog
    app.post('/timelog', timelog.save(db));
    app.get('/timelog/:userId', timelog.getForPeriod(db));

    //run application after mongo
    app.listen(app.get('port'), function() {
        console.log('Homogen server is started on port: ' + app.get('port'));
    });
}

function parseDate(key, value) {
    if (typeof value === 'string' && key.toLowerCase().indexOf('date') > -1) {
        return moment(value, "MM-DD-YYYY").toDate();
    }
    return value;
}
