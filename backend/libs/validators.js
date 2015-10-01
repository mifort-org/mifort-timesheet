var validator = require('validator');
var reqParams = require('./req_params');

var emptyBody = {
    code: 400,
    message: 'Request body cannot be empty!'
};

//Project Rest Api validators
exports.validateSaveProject = function(req, res, next) {
    var project = req.body;
    if(project) {
        req.checkBody('name', 'Project name is required').notEmpty();
        if(!project._id) {
            req.checkBody('companyId', 'Company id is required and should have valid format')
                .notEmpty().isMongoId();
        }
        var errors = req.validationErrors(true);
        if(errors) {
            res.status(400).json(errors);
            return;
        }
        next(); // success validation!
        
    } else {
        res.status(emptyBody.code).json({msg: emptyBody.message});
    }
};

exports.validateGetProjectById = function(req, res, next) {
    req.checkParams(reqParams.projectIdParam, 'Project id param is required and should have valid format')
            .notEmpty().isMongoId();
    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
};

exports.validateGetProjectByCompanyId = function(req, res, next) {
    req.check(reqParams.companyIdParam, 'Company id param is required and should have valid format')
            .notEmpty().isMongoId();

    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
};

//User Rest API validators
exports.validateGetUserByProjectId = function(req, res, next) {
    req.check(reqParams.projectIdParam, 'Project id param is required and should have valid format')
            .notEmpty().isMongoId();
    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
};

exports.validateGetUserByCompanyId = function(req, res, next) {
    req.check(reqParams.companyIdParam, 'Company id param is required and should have valid format')
            .notEmpty().isMongoId();
    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
};

exports.validateReplaceAssignment = function(req, res, next) {
    req.checkParams(reqParams.projectIdParam, 'Project id param is required and should have valid format')
            .notEmpty().isMongoId();

    var user = req.body;
    if(!user) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }

    req.checkBody('_id', 'User id is required').notEmpty().isMongoId();
    req.checkBody('assignments', 'Incorrect Assignments (Check: userId, projectId, projectName)')
        .optional().isAssignments();

    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
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
    req.checkParams(reqParams.companyIdParam, 'Company id param is required and should have valid format')
            .notEmpty().isMongoId();

    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
};

//Timelog Rest API validation
exports.validateGetTimelogByDates = function(req, res, next) {
    req.checkParams(reqParams.userIdParam, 'User id param is required and should have valid format')
            .notEmpty().isMongoId();
    req.checkQuery(reqParams.projectIdParam, 'Project id param is required and should have valid format')
            .notEmpty().isMongoId();
    req.checkQuery(reqParams.startDateParam, 'Start date param is required and should have valid format')
            .notEmpty().isDate();
    req.checkQuery(reqParams.endDateParam, 'End date param is required and should have valid format')
            .notEmpty().isDate();

    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
};

exports.validateDeleteTimelog = function(req, res, next) {
    req.checkParams(reqParams.userIdParam, 'Timelog id param is required and should have valid format')
            .notEmpty().isMongoId();

    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
};

exports.validateSaveTimelog = function(req, res, next) {
    var timelogs = req.body;
    if(!timelogs) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }
    req.checkBody('timelog', 'Incorrect timelog (Check: date, userId, projectId, projectName)')
        .isTimelog();
    
    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }

    next();
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