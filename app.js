/*!
 * Copyright 2015 mifort.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Andrew Voitov
 */

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var expressValidator = require('express-validator');
var compression = require('compression');

var project = require('./backend/project');
var timelog = require('./backend/timelog');
var user = require('./backend/user');
var company = require('./backend/company');
var report = require('./backend/report');
var admin = require('./backend/admin')

var authentication = require('./backend/libs/authentication');
var authorization = require('./backend/libs/authorization');
var util = require('./backend/libs/utils');
var validators = require('./backend/libs/validators');
var log = require('./backend/libs/logger');
var errorHandler = require('./backend/libs/error_handler');
var dbSettings = require('./backend/libs/mongodb_settings');
var mail = require('./backend/libs/mail');

var app = express();
app.set('port', process.env.PORT || 1313);
app.set('json replacer', util.jsonStringify);

if (app.get('env') === 'production') {
    app.set('trust proxy', true);
    log.info('Production Mode!!!');
} else {
    log.info('Development Mode!!!');
}

app.use(cookieParser());
app.use(compression());
app.use(express.static('frontend'));
app.use(bodyParser.json({reviver:util.jsonParse}));
log.info('Static resources are initialized!');

app.use(expressValidator({
    customValidators: {
        isTimelog: validators.timelogs,
        isArray: validators.isArray,
        isAssignments: validators.isAssignments,
        isEmails: validators.isEmails,
        isFilters: validators.isFilters,
        isString: validators.isString
    }
}));

app.use(session(
    { secret: 'homogen cat' ,
    name: 'kaas',
    cookie: { maxAge : 3600000 },
    resave: false,
    rolling: true,
    saveUninitialized: true,
    store: new MongoStore({url: dbSettings.sessionMongoUrl})})
);
//last step: init auth
authentication.init(app);

//add auth.ensureAuthenticated for each Rest API
app.use('/', function(req, res, next){
    authentication.ensureAuthenticated(req, res, next);
});

//project
app.post('/project',
        validators.validateSaveProject,
        authorization.authorizeSaveProject,
        project.restSave);
app.get('/project/:projectId',
        validators.validateGetProjectById,
        authorization.authorizeGetProjectById,
        project.restGetById);
app.get('/projects',
        validators.validateGetProjectByCompanyId,
        authorization.authorizeGetProjectsByCompanyId,
        project.restGetByCompanyId);
app.get('/project/deactivate/:projectId',
        validators.validateDeactivateProject,
        authorization.authorizeDeactivateProject,
        project.restDeactivateProject);

//timelog
app.post('/timelog',
        validators.validateSaveTimelog,
        authorization.authorizeSaveTimelog,
        timelog.restSave);
app.get('/timelog/:userId',
        validators.validateGetTimelogByDates,
        authorization.authorizeGetTimelog,
        timelog.restGetByDates);
app.delete('/timelog/:timelogId',
        validators.validateDeleteTimelog,
        authorization.authorizeDeleteTimelog,
        timelog.restDelete);

//user
app.get('/user',
        user.restGetCurrent);
app.get('/user/project/:projectId',
        validators.validateGetUserByProjectId,
        authorization.authorizeGetUsersByProjectId,
        user.restGetByProjectId);
app.get('/user/company/:companyId',
        validators.validateGetUserByCompanyId,
        authorization.authorizeGetUsersByCompanyId,
        user.restGetByCompanyId);
app.post('/user/assignment/:projectId',
        validators.validateReplaceAssignment,
        authorization.authorizeAddAssignment,
        user.restReplaceAssignments);
app.post('/user/update-role',
        validators.validateUpdateRole,
        authorization.authorizaUpdateRole,
        user.restUpdateUserRole);
app.delete('/user/:userId',
        validators.validateDeleteUser,
        authorization.authorizeDeleteUser,
        user.restDeleteUser);
app.put('/user',
        validators.validateAddNewUser,
        authorization.authorizeAddNewUser,
        user.restAddNewUser);

//company
app.post('/company',
        validators.validateUpdateCompany,
        authorization.authorizeUpdateCompany,
        company.restUpdateCompany);
app.put('/company',
        validators.validateCreateCompany,
        authorization.authorizeCreateCompany,
        company.restCreateCompany);
app.get('/company/:companyId',
        validators.validateGetCompanyById,
        authorization.authorizeGetCompanyById,
        company.restFindById);

//report
app.get('/report/filters/:companyId',
        validators.validateGetFilters,
        authorization.authorizeGetFilters,
        report.restGetFilterValues);
app.post('/report/common',
        validators.validateCommonReport,
        authorization.authorizeCommonReport,
        report.restCommonReport);
app.post('/report/common/download',
        validators.validateDowloadCommonReport,
        authorization.authorizeCommonReport,
        report.restConstructCSV);
app.get('/report/download/:fileName',
        validators.validateGetDownloadReport,
        report.restDownloadFile);

//Admin part
app.get('/admin/log/:fileName',
        validators.validateDownloadLogs,
        authorization.authorizeDownloadLogs,
        admin.restDownloadLog);

log.info('REST API is ready!');

// default error handler
app.use(errorHandler);
log.info('Error handler is initialized!');

//email send example
//mail.sendInvite('andreivoitau@gmail.com', 'blablabla');

//run application
app.listen(app.get('port'), function() {
    log.info('MiTimesheet server is started on port: %d', app.get('port'));
});
