var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var timesheet = require('./backend/timesheet');
var timelog = require('./backend/timelog');
var auth = require('./backend/libs/auth');
var util = require('./backend/libs/utils');

var app = express();
app.set('port', process.env.PORT || 1313);
    
app.use(cookieParser());
app.use(express.static('frontend'));
app.use(bodyParser.json({reviver:util.jsonParse}));
app.use(session({ secret: 'homogen cat' , name: 'kaas', resave: true, saveUninitialized: true}));
//last step: init auth
auth.init(app);

//timesheet
app.post('/timesheet', timesheet.save);
app.get('/timesheet/:projectId', auth.ensureAuthenticated, timesheet.getByProjectId);
app.get('/timesheet/:projectId/calendar', timesheet.getCalendarByPeriod);

//timelog
app.post('/timelog', timelog.save);
app.get('/timelog/:userId', timelog.getByDates);

//run application
app.listen(app.get('port'), function() {
    console.log('Homogen server is started on port: ' + app.get('port'));
});
