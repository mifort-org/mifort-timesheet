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

var validator = require('validator');
var reqParams = require('./req_params');
var util = require('util');
var utils = require('./utils');
var constants = require('./config_constants');

var emptyBody = {
    code: 400,
    message: 'Request body cannot be empty!'
};
var timelogValidationError = {
    code: 400,
    message: "Timelog validation is failed"
};

var invalidFormatMessageTemplate = '%s is required and should have a valid format';

//Project Rest Api validators
exports.validateSaveProject = function(req, res, next) {
    var project = req.body;
    if(project) {
        req.checkBody('name', 'Project name is required').notEmpty();
        if(!project._id) {
            req.checkBody('companyId', util.format(invalidFormatMessageTemplate, 'companyId'))
                .notEmpty().isObjectId();
        }

        returnErrors(req, res, next);

    } else {
        res.status(emptyBody.code).json({msg: emptyBody.message});
    }
};

exports.validateGetProjectById = function(req, res, next) {
    req.checkParams(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isObjectId();

    returnErrors(req, res, next);
};

exports.validateGetProjectByCompanyId = function(req, res, next) {
    req.check(reqParams.companyIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.companyIdParam))
            .notEmpty().isObjectId();

    returnErrors(req, res, next);
};

exports.validateDeleteProject = function(req, res, next) {
    req.checkParams(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isObjectId();

    returnErrors(req, res, next);
}

//User Rest API validators
exports.validateGetUserByProjectId = function(req, res, next) {
    req.check(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isObjectId();

    returnErrors(req, res, next);
};

exports.validateGetUserByCompanyId = function(req, res, next) {
    req.check(reqParams.companyIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.companyIdParam))
            .notEmpty().isObjectId();
    returnErrors(req, res, next);
};

exports.validateReplaceAssignment = function(req, res, next) {
    req.checkParams(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isObjectId();

    var user = req.body;
    if(!user) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }

    req.checkBody('_id', util.format(invalidFormatMessageTemplate, 'User id')).notEmpty().isObjectId();
    req.checkBody('assignments', 'Incorrect Assignments (Check: projectId, projectName)')
        .optional().isAssignments(req.params[reqParams.projectIdParam]);

    returnErrors(req, res, next);
};

exports.validateUpdateRole = function(req, res, next) {
    var user = req.body;
    if(!user) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }

    req.checkBody('_id', util.format(invalidFormatMessageTemplate, 'User id')).notEmpty().isObjectId();
    req.checkBody('role', util.format(invalidFormatMessageTemplate, 'Role'))
        .notEmpty().isIn([constants.EMPLOYEE_ROLE, constants.MANAGER_ROLE, constants.OWNER_ROLE]);
    returnErrors(req, res, next);
};

exports.validateUserIdParam = function(req, res, next) {
    req.checkParams(reqParams.userIdParam, util.format(invalidFormatMessageTemplate, reqParams.userIdParam))
            .notEmpty().isObjectId();

    returnErrors(req, res, next);
};

exports.validateAddNewUser = function(req, res, next) {
    var user = req.body;
    if(!user) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }

    req.checkBody('email', 'E-mail is not valid').notEmpty().isEmail();
    req.checkBody('companyId', 'Company is not valid').notEmpty().isObjectId();
    req.checkBody('role', 'Role should be Manager or Employee')
        .optional().isIn([constants.EMPLOYEE_ROLE, constants.MANAGER_ROLE]);

    returnErrors(req, res, next);
};

exports.validateGetListByEmail = function(req, res, next) {
  req.checkParams(reqParams.emailParam,
    util.format(invalidFormatMessageTemplate, reqParams.emailParam))
    .notEmpty().isEmail();

  returnErrors(req, res, next);
};

//Company Rest API validation
exports.validateUpdateCompany = function(req, res, next) {
    var company = req.body;
    if(!company) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }
    req.checkBody('_id', util.format(invalidFormatMessageTemplate, 'Company id')).notEmpty().isObjectId();
    req.checkBody('emails', "Property 'emails' is not an array!" ).optional().isArray();
    req.checkBody('emails', 'At least one email has incorrect format').optional().isEmails();
    req.checkBody('description', 'Field is not a string').optional().isString();
    req.checkBody('periods', 'Start period date > end period date').optional().isCorrectPeriods();

    returnErrors(req, res, next);
};

exports.validateCreateCompany = function(req, res, next) {
    var company = req.body;
    if(!company) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }

    req.checkBody('emails', "Property 'emails' is not an array!" ).optional().isArray();
    req.checkBody('emails', 'At least one email has incorrect format').optional().isEmails();
    req.checkBody('description', 'Field is not a string').optional().isString();
    req.checkBody('periods', 'Start period date > end period date').optional().isCorrectPeriods();

    returnErrors(req, res, next);
};

exports.validateGetCompanyById = function(req, res, next) {
    req.checkParams(reqParams.companyIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.companyIdParam))
            .notEmpty().isObjectId();

    returnErrors(req, res, next);
};

//Timesheet Rest API validation
exports.validateGetTimesheetByDates = function(req, res, next) {
    req.checkParams(reqParams.userIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.userIdParam))
            .notEmpty().isObjectId();

    req.checkQuery(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isObjectId();

    req.checkQuery(reqParams.startDateParam,
        util.format(invalidFormatMessageTemplate, reqParams.startDateParam))
            .notEmpty().isDate();

    req.checkQuery(reqParams.endDateParam,
        util.format(invalidFormatMessageTemplate, reqParams.endDateParam))
            .notEmpty().isDate();

    returnErrors(req, res, next);
};

exports.validateDeleteTimesheet = function(req, res, next) {
    req.checkParams(reqParams.timelogIdParam, util.format(invalidFormatMessageTemplate, reqParams.timelogIdParam))
            .notEmpty().isObjectId();

    returnErrors(req, res, next);
};

exports.validateSaveTimesheet = function(req, res, next) {
    var timelogs = req.body;
    if(!timelogs) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }
    req.checkBody('timesheet', 'Required fields: date, userId, projectId, projectName, userName')
        .isTimesheet();

    returnErrors(req, res, next);
};

exports.validateActivateProject = function(req, res, next) {
    req.check(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isObjectId();

    returnErrors(req, res, next);
};

//SaveOneLog
exports.validateSaveOneLog = function(req, res, next) {
    var timelog = req.body;
    if(!timelog) {
        return res.status(emptyBody.code).json({msg: emptyBody.message});
    }
    if(!isOneLog(timelog)) {
        return res.status(timelogValidationError.code).json({msg: timelogValidationError.message});
    }

    returnErrors(req, res, next);
};


//Report validation
exports.validateCommonReport = function(req, res, next) {
    checkReportFieldsWithPaging(req);
    returnErrors(req, res, next);
};

exports.validateDowloadCommonReport = function(req, res, next) {
    checkReportRequiredFields(req);
    returnErrors(req, res, next);
};

exports.validateAggregationReport = function(req, res, next) {
    checkReportFieldsWithPaging(req);
    req.checkBody('groupBy', 'Aggregation group by params are not an array of strings').isGroupBy();
    returnErrors(req, res, next);
};

exports.validateDownloadAggregationReport = function(req, res, next) {
    checkReportRequiredFields(req);
    req.checkBody('groupBy', 'Aggregation group by params are not an array of strings').isGroupBy();
    returnErrors(req, res, next);
};

exports.validateGetFilters = function(req, res, next) {
    req.checkParams(reqParams.companyIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.companyIdParam))
            .notEmpty().isObjectId();

    returnErrors(req, res, next);
};

exports.validateGetDownloadReport = function(req, res, next) {
    req.checkParams(reqParams.fileNameParam,
        util.format(invalidFormatMessageTemplate, reqParams.fileNameParam))
            .notEmpty().containsAny(['.csv','.pdf']);
    returnErrors(req, res, next);
};

exports.validateDownloadLogs = function(req, res, next) {
    req.checkParams(reqParams.fileNameParam,
        util.format(invalidFormatMessageTemplate, reqParams.fileNameParam))
            .notEmpty();

    returnErrors(req, res, next);
};

//Custom validators for express-validator
exports.config = {
    customValidators: {
        isTimesheet: isTimesheet,
        isOneLog: isOneLog,
        isArray: isArray,
        isAssignments: isAssignments,
        isEmails: isEmails,
        isFilters: isFilters,
        isString: isString,
        isGroupBy: isGroupBy,
        isDate: utils.isDate,
        isObjectId: isObjectId,
        isCorrectPeriods: isCorrectPeriods
    }
};


//val ids
exports.validateIds = function(req, res, next) {
    req.checkParams(reqParams.count, util.format(invalidFormatMessageTemplate, reqParams.count))
        .isInt();

    returnErrors(req, res, next);
};

//Private part

// should be refactored
function isTimesheet(values) {
    if(Array.isArray(values)) {
        return values.every(isOneLog);
    }
    return false;
}

//for OneLog
function isOneLog(val) {
    var isValid = true;
    if(val._id){
        isValid = isObjectId(val._id);
    }
    if(typeof val.time === 'number'){
        isValid = isValid
            && (0 <= val.time && val.time <= 24);
    } else if (val.time != null) { // time field is required
        return false;
    }
    if(val.role){
        isValid = isValid
            && (typeof val.role === 'string');
    }
    if(val.position) {
        isValid = isValid && validator.isInt(val.position);
    }
    isValid = isValid
        && isObjectId(val.userId) //required && format
        && isObjectId(val.projectId) //required && format
        && validator.isLength(val.projectName, 1) //required
        && utils.isDate(val.date) //required && format
        && validator.isLength(val.userName, 1); //required
    return isValid;
}

function isCorrectPeriods(periods) {
    if(!Array.isArray(periods)) {
        return false;
    }

    return periods.every(function(period){
        return period.start <= period.end;
    });
}

function isArray(value) {
    return Array.isArray(value);
}

function isAssignments(values, projectId) {
    if(!values.length) { // if array is empty
        return true;
    }

    if(Array.isArray(values)) {
        return values.every(function(val){
            return isObjectId(val.projectId)
                && isObjectId(projectId)
                && (val.projectId.equals(projectId))
                && validator.isLength(val.projectName, 1);
        });
    }
    return false;
}

function isEmails(values) {
    if(Array.isArray(values)) {
        return values.every(function(val) {
            return validator.isEmail(val);
        });
    }

    return false;
}

function isFilters(filters) {
    if(filters && !filters.length) { // if array is empty
        return true;
    }

    if(Array.isArray(filters)) {
        return filters.every(function(filter) {
            if(filter.field === 'date') {
                return utils.isDate(filter.start)
                    && utils.isDate(filter.end);
            }
            if(filter.field === 'userId'){
                if(Array.isArray(filter.value)){
                    return filter.value.every(function(val){
                            return isObjectId(val);
                        });
                } else {
                    return false;
                }
            }
            if (filter.field === 'time') {
                return isObject(filter.value);
            }
            return Array.isArray(filter.value);
        });
    }

    return false;
}

function isString(obj) {
    return typeof obj === 'string';
}

function isObject(obj) {
    return typeof obj === 'object';
}

function isObjectId (value) {
    return value ? validator.isMongoId(value.toString()) : false;
}

function isGroupBy(values) {
    if(Array.isArray(values)) {
        return values.every(function(val) {
            return isString(val);
        });
    }

    return false;
}

function returnErrors(req, res, next) {
    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }

    next();
}

function checkReportRequiredFields(req) {
    var filterObj = req.body;
    req.checkBody('companyId', 'Company id is required').notEmpty().isObjectId();
    req.checkBody('filters', 'Incorrect filters value').isFilters();
    if(filterObj.sort) {
        req.checkBody('sort.field', 'Field name is required for sort object').notEmpty();
        req.checkBody('sort.asc', 'Asc attribute is required for sort object').notEmpty().isBoolean();
    }
}

function checkReportFieldsWithPaging(req) {
    req.checkBody('page', 'Page is required').notEmpty().isInt();
    req.checkBody('pageSize', 'Page size is required').notEmpty().isInt();
    checkReportRequiredFields(req);
}
