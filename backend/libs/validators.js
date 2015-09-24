var projectIdParam = 'projectId';
var companyIdParam ='companyId';

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