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
 */

var validator = require('validator');
var reqParams = require('./req_params');
var util = require('util');

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
    req.checkBody('assignments', 'Incorrect Assignments (Check: userId, projectId, projectName)')
        .optional().isAssignments(req.params[reqParams.projectIdParam], req.body._id);

    returnErrors(req, res, next);
};

//Company Rest API validation
exports.validateUpdateCompany = function(req, res, next) {
    var company = req.body;
    if(!company) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }
    next();
};

exports.validateCreateCompany = function(req, res, next) {
    var company = req.body;
    if(!company) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }

    req.checkBody('emails', "Property 'emails' is not an array!" ).optional().isArray();
    req.checkBody('emails', 'At least one email has incorrect format').optional().isEmails();

    returnErrors(req, res, next);
};

exports.validateGetCompanyById = function(req, res, next) {
    req.checkParams(reqParams.companyIdParam, 
        util.format(invalidFormatMessageTemplate, reqParams.companyIdParam))
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
};

//Timelog Rest API validation
exports.validateGetTimelogByDates = function(req, res, next) {
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

exports.validateDeleteTimelog = function(req, res, next) {
    req.checkParams(reqParams.timelogIdParam, util.format(invalidFormatMessageTemplate, reqParams.timelogIdParam))
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
};

exports.validateSaveTimelog = function(req, res, next) {
    var timelogs = req.body;
    if(!timelogs) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }
    req.checkBody('timelog', 'Incorrect timelog (Check: date, userId, projectId, projectName)')
        .isTimelog();
    
    returnErrors(req, res, next);
};

exports.validateDeactivateProject = function(req, res, next) {
    req.check(reqParams.projectIdParam, 
        util.format(invalidFormatMessageTemplate, reqParams.projectIdParam))
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
};

//Custom validators for express-validator
exports.isArray = function(value) {
    return Array.isArray(value);
};

exports.timelogs = function(values) {
    if(Array.isArray(values)) {
        return values.every(function(val){
            var isValid = true;
            if(val._id){
                isValid = validator.isMongoId(val._id);
            }
            isValid = isValid
                && validator.isMongoId(val.userId) //required && format
                && validator.isMongoId(val.projectId) //required && format
                && validator.isLength(val.projectName, 1) //required
                && validator.isDate(val.date); //required && format
            return isValid;
        });
    }
    return false;
};

exports.assignments = function(values, projectId, userId) {
    if(!values.length) { // if array is empty
        return true;
    }

    if(Array.isArray(values)) {
        return values.every(function(val){
            return validator.isMongoId(val.projectId)
                && validator.isMongoId(projectId)
                && (val.projectId.equals(projectId))
                && validator.isLength(val.projectName, 1)
                && validator.isMongoId(val.userId)
                && validator.isMongoId(userId)
                && (val.userId.equals(userId));
        });
    }
    return false;
};

exports.isEmails = function(values) {
    if(Array.isArray(values)) {
        return values.every(function(val) {
            return validator.isEmail(val);
        });
    }

    return false;
};

//Private part
function returnErrors(req, res, next) {
    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }

    next();
}