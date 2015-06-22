//Dependencies
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var ejs = require('ejs');
var mysql = require('mysql');

// Mysql connection pool. Close after application stop!!!! Not implemented yet
var pool  = mysql.createPool({
  connectionLimit : 10,
  database        : 'homogen',
  user            : 'root',
  password        : '' //insert you passwor. Shoud be changed to ENV properties
});

//create tables
pool.getConnection(function(err, connection) {
  
  connection.query( 'CREATE TABLE IF NOT EXISTS timelog ('
                  + 'id INT NOT NULL AUTO_INCREMENT, '
                  + 'date DATE, '
                  + 'actual TINYINT, '
                  + 'comment TEXT, '
                  + 'PRIMARY KEY(id))', 
  	function(err) {
  		if(err) console.log(err);
    	console.log('Table timelog is created');
    	connection.release();
  });
});

var Timesheet = require('./libs/timesheet');
var timesheet = new Timesheet(pool);

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
app.post('/save', timesheet.save);

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});