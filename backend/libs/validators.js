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
var authorization = require('./authorization');

var emptyBody = {
    code: 400,
    message: 'Request body cannot be empty!'
};

var invalidFormatMessageTemplate = '%s is required and should have a valid format';

//Project Rest Api validators
exports.validateSaveProject = function(req, res, next) {
    var project = req.body;
    if(project) {
        req.checkBody('name', 'Project name is required').notEmpty();
        if(!project._id) {
            req.checkBody('companyId', util.format(invalidFormatMessageTemplate, 'companyId'))
                .notEmpty().isMongoId();
        }

        returnErrors(req, res, next);

    } else {
        res.status(emptyBody.code).json({msg: emptyBody.message});
    }
};

exports.validateGetProjectById = function(req, res, next) {
    req.checkParams(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
};

exports.validateGetProjectByCompanyId = function(req, res, next) {
    req.check(reqParams.companyIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.companyIdParam))
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
};

exports.validateDeleteProject = function(req, res, next) {
    req.checkParams(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
}

//User Rest API validators
exports.validateGetUserByProjectId = function(req, res, next) {
    req.check(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
};

exports.validateGetUserByCompanyId = function(req, res, next) {
    req.check(reqParams.companyIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.companyIdParam))
            .notEmpty().isMongoId();
    returnErrors(req, res, next);
};

exports.validateReplaceAssignment = function(req, res, next) {
    req.checkParams(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isMongoId();

    var user = req.body;
    if(!user) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }

    req.checkBody('_id', util.format(invalidFormatMessageTemplate, 'User id')).notEmpty().isMongoId();
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

    req.checkBody('_id', util.format(invalidFormatMessageTemplate, 'User id')).notEmpty().isMongoId();
    req.checkBody('role', util.format(invalidFormatMessageTemplate, 'Role'))
        .notEmpty().isIn([authorization.EMPLOYEE_ROLE, authorization.MANAGER_ROLE, authorization.OWNER_ROLE]);
    returnErrors(req, res, next);
};

exports.validateDeleteUser = function(req, res, next) {
    req.checkParams(reqParams.userIdParam, util.format(invalidFormatMessageTemplate, reqParams.userIdParam))
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
};

exports.validateAddNewUser = function(req, res, next) {
    var user = req.body;
    if(!user) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }

    req.checkBody('email', 'E-mail is not valid').notEmpty().isEmail();
    req.checkBody('companyId', 'Company is not valid').notEmpty().isMongoId();
    req.checkBody('role', 'Role should be Manager or Employee')
        .optional().isIn([authorization.EMPLOYEE_ROLE, authorization.MANAGER_ROLE]);

    returnErrors(req, res, next);
};
//Company Rest API validation
exports.validateUpdateCompany = function(req, res, next) {
    var company = req.body;
    if(!company) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }
    req.checkBody('_id', util.format(invalidFormatMessageTemplate, 'Company id')).notEmpty().isMongoId();
    req.checkBody('emails', "Property 'emails' is not an array!" ).optional().isArray();
    req.checkBody('emails', 'At least one email has incorrect format').optional().isEmails();
    req.checkBody('description', 'Field is not a string').optional().isString();

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

    returnErrors(req, res, next);
};

exports.validateGetCompanyById = function(req, res, next) {
    req.checkParams(reqParams.companyIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.companyIdParam))
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
};

//Timesheet Rest API validation
exports.validateGetTimesheetByDates = function(req, res, next) {
    req.checkParams(reqParams.userIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.userIdParam))
            .notEmpty().isMongoId();

    req.checkQuery(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isMongoId();

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
            .notEmpty().isMongoId();

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

exports.validateDeactivateProject = function(req, res, next) {
    req.check(reqParams.projectIdParam,
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isMongoId();

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
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
};

exports.validateGetDownloadReport = function(req, res, next) {
    req.checkParams(reqParams.fileNameParam,
        util.format(invalidFormatMessageTemplate, reqParams.fileNameParam))
            .notEmpty().contains('.csv');

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
        isArray: isArray,
        isAssignments: isAssignments,
        isEmails: isEmails,
        isFilters: isFilters,
        isString: isString,
        isGroupBy: isGroupBy
    }
};

//Private part

// should be refactored
function isTimesheet(values) {
    if(Array.isArray(values)) {
        return values.every(function(val){
            var isValid = true;
            if(val._id){
                isValid = validator.isMongoId(val._id);
            }
            if(val.time){
                isValid = isValid
                    && (typeof val.time === 'number')
                    && val.time <= 24;
            }
            if(val.role){
                isValid = isValid
                    && (typeof val.role === 'string');
            }
            if(val.position) {
                isValid = isValid && validator.isInt(val.position);
            }
            isValid = isValid
                && validator.isMongoId(val.userId) //required && format
                && validator.isMongoId(val.projectId) //required && format
                && validator.isLength(val.projectName, 1) //required
                && validator.isDate(val.date) //required && format
                && validator.isLength(val.userName, 1); //required
            return isValid;
        });
    }
    return false;
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
            return validator.isMongoId(val.projectId)
                && validator.isMongoId(projectId)
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
                return validator.isDate(filter.start)
                    && validator.isDate(filter.end);
            } else {
                return Array.isArray(filter.value);
            }
        });
    }

    return false;
}

function isString(obj) {
    return typeof obj === 'string';
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
    req.checkBody('companyId', 'Company id is required').notEmpty().isMongoId();
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
