//MongoDb dependencies && config
var timesheet = require('./backend/timesheet');
var MongoClient = require('mongodb').MongoClient
var express = require('express');
var bodyParser = require('body-parser');

var mongodbUrl = 'mongodb://localhost:27017/homogen';

MongoClient.connect(mongodbUrl, function(err, db){
    if(err) throw err;
    initApplication(db);
});

function initApplication(db) {
    var app = express();
    app.set('port', process.env.PORT || 1313);
    app.use(bodyParser.json());

    app.get('/project/13/timesheet', timesheet.getByProjectName(db));

    //run application after mongo connection
    app.listen(app.get('port'), function() {
        console.log('Homogen server is started on port: ' + app.get('port'));
    });
}