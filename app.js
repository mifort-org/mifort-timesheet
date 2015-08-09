//MongoDb dependencies && config
var timesheet = require('./backend/timesheet');
var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var bodyParser = require('body-parser');

var mongodbUrl = 'mongodb://localhost:27017/homogen';

MongoClient.connect(mongodbUrl, function(err, db){
    if(err) {
    	initApplicationWithoutDB();
    } else {
    	initApplication(db);
    }
});

//temporary method
function initApplicationWithoutDB() {
	console.log("...Without DB...")
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
    app.use(express.static('frontend'));
    app.use(bodyParser.json());

    app.get('/project/:id/timesheet', timesheet.getByProjectName(db));
    app.post('/project', timesheet.save(db));

    //run application after mongo connection
    app.listen(app.get('port'), function() {
        console.log('Homogen server is started on port: ' + app.get('port'));
    });
}
