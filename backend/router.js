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
var authorization = require('./libs/authorization');
var validators = require('./libs/validators');

//timesheet
var timelog = require('./timelog');
var timesheetRouter = express.Router();
timesheetRouter.post('/',
        validators.validateSaveTimesheet,
        authorization.authorizeSaveTimesheet,
        timelog.restSave);
timesheetRouter.get('/:userId',
        validators.validateGetTimesheetByDates,
        authorization.authorizeGetTimesheet,
        timelog.restGetByDates);
timesheetRouter.delete('/:timelogId',
        validators.validateDeleteTimesheet,
        authorization.authorizeDeleteTimesheet,
        timelog.restDelete);

exports.timesheetRouter = timesheetRouter;

//project
var project = require('./project');
var projectRouter = express.Router();
projectRouter.post('/',
        validators.validateSaveProject,
        authorization.authorizeSaveProject,
        project.restSave);
projectRouter.get('/list',  // project list!!!!!!!!!!!!
        validators.validateGetProjectByCompanyId,
        authorization.authorizeGetProjectsByCompanyId,
        project.restGetByCompanyId);
projectRouter.get('/:projectId',
        validators.validateGetProjectById,
        authorization.authorizeGetProjectById,
        project.restGetById);
projectRouter.get('/deactivate/:projectId',
        validators.validateActivateProject,
        authorization.authorizeActivateProject, // the same rules as activate
        project.restDeactivateProject);
projectRouter.get('/activate/:projectId',
        validators.validateActivateProject,
        authorization.authorizeActivateProject,
        project.restActivateProject);
projectRouter.delete('/:projectId',
        validators.validateDeleteProject,
        authorization.authorizeDeleteProject,
        project.restDeleteProject);
exports.projectRouter = projectRouter;

//user
var user = require('./user');
var userRouter = express.Router();

userRouter.get('/users',
        user.restGetByEmail);
userRouter.get('/:userId',
        validators.validateUserIdParam,
        authorization.authorizeGetUserById,
        user.restGetById);
userRouter.get('/',
        user.restGetCurrent);
userRouter.get('/project/:projectId',
        validators.validateGetUserByProjectId,
        authorization.authorizeGetUsersByProjectId,
        user.restGetByProjectId);
userRouter.get('/company/:companyId',
        validators.validateGetUserByCompanyId,
        authorization.authorizeGetUsersByCompanyId,
        user.restGetByCompanyId);
userRouter.post('/assignment/:projectId',
        validators.validateReplaceAssignment,
        authorization.authorizeAddAssignment,
        user.restReplaceAssignments);
userRouter.post('/update-role',
        validators.validateUpdateRole,
        authorization.authorizaUpdateRole,
        user.restUpdateUserRole);
userRouter.delete('/:userId',
        validators.validateUserIdParam,
        authorization.authorizeDeleteUser,
        user.restDeleteUser);
userRouter.put('/',
        validators.validateAddNewUser,
        authorization.authorizeAddNewUser,
        user.restAddNewUser);

//company
var company = require('./company');
var companyRouter = express.Router();
companyRouter.post('/',
        validators.validateUpdateCompany,
        authorization.authorizeUpdateCompany,
        company.restUpdateCompany);
companyRouter.put('/',
        validators.validateCreateCompany,
        authorization.authorizeCreateCompany,
        company.restCreateCompany);
companyRouter.get('/:companyId',
        validators.validateGetCompanyById,
        authorization.authorizeGetCompanyById,
        company.restFindById);

//report
var report = require('./report');
var reportRouter = express.Router();
reportRouter.get('/filters/:companyId',
        validators.validateGetFilters,
        authorization.authorizeGetFilters,
        report.restGetFilterValues);
reportRouter.post('/common',
        validators.validateCommonReport,
        authorization.authorizeCommonReport,
        report.restCommonReport);
reportRouter.post('/common/download/csv',
        validators.validateDowloadCommonReport,
        authorization.authorizeCommonReport,
        report.restCommonReportCSV);
reportRouter.post('/common/download/pdf',
        validators.validateDowloadCommonReport,
        authorization.authorizeCommonReport,
        report.restCommonReportPDF);
//aggregation reports
reportRouter.post('/aggregation',
        validators.validateAggregationReport,
        authorization.authorizeCommonReport,
        report.restAggregationReport);
reportRouter.post('/aggregation/download/csv',
        validators.validateDownloadAggregationReport,
        authorization.authorizeCommonReport,
        report.restAggregationReportCSV);
reportRouter.get('/download/:fileName',
        validators.validateGetDownloadReport,
        report.restDownloadFile);

//Admin part
var admin = require('./admin');
var adminRouter = express.Router();
adminRouter.get('/log/:fileName',
        validators.validateDownloadLogs,
        authorization.authorizeDownloadLogs,
        admin.restDownloadLog);
adminRouter.get('/build',
        admin.restBuildInfo);

//main router
var versionRouter = express.Router();
versionRouter.use('/project', projectRouter);
versionRouter.use('/timesheet', timesheetRouter);
versionRouter.use('/user', userRouter);
versionRouter.use('/company', companyRouter);
versionRouter.use('/report', reportRouter);
versionRouter.use('/admin', adminRouter);
exports.versionRouter = versionRouter;
