//Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var timesheet = require('./libs/timesheet');
var ejs = require('ejs');

var app = express();

//template location
app.set('views', __dirname + '/views');
//template engine
app.set('view engine', 'ejs');
//set port number
app.set('port','3000');
//static resources
app.use(express.static(path.join(__dirname,'public')));
//body parser
app.use(bodyParser.urlencoded({extended: true}));

//render timesheet table
app.get('/timesheet', timesheet.table);
app.post('/save', function(req, res, next) {
	console.log(req.body);
	next();
});

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});