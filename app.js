var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var project = require('./backend/project');
var timelog = require('./backend/timelog');
var user = require('./backend/user');
var company = require('./backend/company');
var auth = require('./backend/libs/auth');
var util = require('./backend/libs/utils');

var app = express();
app.set('port', process.env.PORT || 1313);
app.set('json replacer', util.jsonStringify);

app.use(cookieParser());
app.use(express.static('frontend'));
app.use(bodyParser.json({reviver:util.jsonParse}));
app.use(session(
    { secret: 'homogen cat' ,
    name: 'kaas',
    cookie: { maxAge : 3600000 },
    resave: true, 
    saveUninitialized: true})
);
//last step: init auth
auth.init(app);

//add auth.ensureAuthenticated for each Rest API
//project
app.post('/project', project.restSave);
app.get('/project/:projectId', project.restGetById);
app.get('/projects', project.restGetByCompanyId);

//timelog
app.post('/timelog', timelog.restSave);
app.get('/timelog/:userId', timelog.restGetByDates);
app.delete('/timelog/:timelogId', timelog.restDelete);

//user
app.get('/user', user.restGetCurrent);
app.get('/users', user.restGetByProjectId);
app.post('/user/assignment/:projectId', user.restReplaceAssignments);

//company
app.post('/company', company.restUpdateCompany);
app.put('/company', company.restCreateCompany);
app.get('/company/:companyId', company.restFindById);

//run application
app.listen(app.get('port'), function() {
    console.log('MiTimesheet server is started on port: ' + app.get('port'));
});
