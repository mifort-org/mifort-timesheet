var validator = require('validator');
var reqParams = require('./req_params');
var util = require('util');

var emptyBody = {
    code: 400,
    message: 'Request body cannot be empty!'
};

var invalidMongoParam = '%s is required and should have valid format';

//Project Rest Api validators
exports.validateSaveProject = function(req, res, next) {
    var project = req.body;
    if(project) {
        req.checkBody('name', 'Project name is required').notEmpty();
        if(!project._id) {
            req.checkBody('companyId', util.format(invalidMongoParam, 'Company id'))
                .notEmpty().isMongoId();
        }

        returnErrors(req, res, next);
        
    } else {
        res.status(emptyBody.code).json({msg: emptyBody.message});
    }
};

exports.validateGetProjectById = function(req, res, next) {
    req.checkParams(reqParams.projectIdParam, util.format(invalidMongoParam, 'Project id param'))
            .notEmpty().isMongoId();
    
    returnErrors(req, res, next);
};

exports.validateGetProjectByCompanyId = function(req, res, next) {
    req.check(reqParams.companyIdParam, util.format(invalidMongoParam, 'Company id param'))
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
};

//User Rest API validators
exports.validateGetUserByProjectId = function(req, res, next) {
    req.check(reqParams.projectIdParam, util.format(invalidMongoParam, 'Project id param'))
            .notEmpty().isMongoId();
    
    returnErrors(req, res, next);
};

exports.validateGetUserByCompanyId = function(req, res, next) {
    req.check(reqParams.companyIdParam, util.format(invalidMongoParam, 'Company id param'))
            .notEmpty().isMongoId();
    returnErrors(req, res, next);
};

exports.validateReplaceAssignment = function(req, res, next) {
    req.checkParams(reqParams.projectIdParam, util.format(invalidMongoParam, 'Project id param'))
            .notEmpty().isMongoId();

    var user = req.body;
    if(!user) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }

    req.checkBody('_id', 'User id is required').notEmpty().isMongoId();
    req.checkBody('assignments', 'Incorrect Assignments (Check: userId, projectId, projectName)')
        .optional().isAssignments();

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

exports.validateGetCompanyById = function(req, res, next) {
    req.checkParams(reqParams.companyIdParam, util.format(invalidMongoParam, 'Company id param'))
            .notEmpty().isMongoId();

    returnErrors(req, res, next);
};

//Timelog Rest API validation
exports.validateGetTimelogByDates = function(req, res, next) {
    req.checkParams(reqParams.userIdParam, util.format(invalidMongoParam, 'User id param'))
            .notEmpty().isMongoId();
    req.checkQuery(reqParams.projectIdParam, util.format(invalidMongoParam, 'Project id param'))
            .notEmpty().isMongoId();
    req.checkQuery(reqParams.startDateParam, util.format(invalidMongoParam, 'Start date param'))
            .notEmpty().isDate();
    req.checkQuery(reqParams.endDateParam, util.format(invalidMongoParam, 'End date param'))
            .notEmpty().isDate();

    returnErrors(req, res, next);
};

exports.validateDeleteTimelog = function(req, res, next) {
    req.checkParams(reqParams.userIdParam, util.format(invalidMongoParam, 'Timelog id param'))
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

exports.assignments = function(values) {
    if(values.length) { // if array is empty
        return true;
    }

    if(Array.isArray(values)) {
        return values.every(function(val){
            return validator.isMongoId(val.projectId)
                && validator.isLength(val.projectName, 1)
                && validator.isMongoId(val.userId);
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