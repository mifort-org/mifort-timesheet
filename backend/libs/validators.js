var projectIdParam = 'projectId'; //the same as in utils.js. Refactoring is needed
var companyIdParam ='companyId';
var userIdParam = 'userId';
var startDateParam = 'startDate';
var endDateParam = 'endDate';
var timelogIdParam = 'timelogId';

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
    req.checkParams(projectIdParam, 'Project id param is required and should have valid format')
            .notEmpty().isMongoId();
    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
};

exports.validateGetProjectByCompanyId = function(req, res, next) {
    req.check(companyIdParam, 'Company id param is required and should have valid format')
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
    req.check(projectIdParam, 'Project id param is required and should have valid format')
            .notEmpty().isMongoId();
    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
};

exports.validateReplaceAssignment = function(req, res, next) {
    req.checkParams(projectIdParam, 'Project id param is required and should have valid format')
            .notEmpty().isMongoId();

    var user = req.body;
    if(!user) {
        res.status(emptyBody.code).json({msg: emptyBody.message});
        return;
    }

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
    req.checkParams(companyIdParam, 'Company id param is required and should have valid format')
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
    req.checkParams(userIdParam, 'User id param is required and should have valid format')
            .notEmpty().isMongoId();
    req.checkQuery(projectIdParam, 'Project id param is required and should have valid format')
            .notEmpty().isMongoId();
    req.checkQuery(startDateParam, 'Start date param is required and should have valid format')
            .notEmpty().isDate();
    req.checkQuery(endDateParam, 'End date param is required and should have valid format')
            .notEmpty().isDate();

    var errors = req.validationErrors(true);
    if(errors) {
        res.status(400).json(errors);
        return;
    }
    next();
};

exports.validateDeleteTimelog = function(req, res, next) {
    req.checkParams(userIdParam, 'Timelog id param is required and should have valid format')
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
    next();
};