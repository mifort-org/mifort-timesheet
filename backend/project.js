var dbSettings = require('./libs/mongodb_settings');
var utils = require('./libs/utils');
var companies = require('./company');

//Rest API
exports.restGetById = function(req, res) {
    var projectId = utils.getProjectId(req);
    var projects = dbSettings.projectCollection();
    projects.findOne({_id: projectId}, 
        function(err, doc) {
            returnProjectCallback(res, err, doc);
        }
    );
};

exports.restSave = function(req, res) {
    var projects = dbSettings.projectCollection();
    var project = req.body;
    
    if(project._id) { //update
        projects.update({ _id: project._id },
                        {$set: {
                            name: project.name
                        },
                        $currentDate: { updatedOn: true }},
            function(err, savedProject) {
                returnProjectCallback(res, err, savedProject);
            });
    } else { //create
        companies.findById(project.companyId, function(err, company) {
            if(err) {
                res.status(500).json(err);
                return;
            }
            project.defaultValues = company.defaultValues;
            project.template = company.template;
            project.periods = company.periods;
            var currentDate = new Date();
            project.createdOn = currentDate;
            project.updatedOn = currentDate;
            project.active = true;
            projects.insertOne(project, {safe: true}, 
                function(err, result) {
                    res.json(result.ops[0]);
                });
        });
    }
};

exports.restGetByCompanyId = function(req, res) {
    var companyId = utils.getCompanyId(req);
    var projects = dbSettings.projectCollection();
    projects.find({companyId: companyId,
                   active: true})
        .toArray(function(err, findedProjects){
            if(err) {
                res.status(404).json({error: 'Cannot find projects!'});
            } else {
                res.json(findedProjects);
            }
        });
};

exports.restDeactivateProject = function(req, res) {
    var projectId = utils.getProjectId(req);
    var projects = dbSettings.projectCollection();
    projects.update({ _id: projectId},
                    {$set: { active: false } },
        function(err, savedProject) {
            returnProjectCallback(res, err, savedProject);
        });
};

//Public API
exports.saveInDb = function(project, callback) {
    var projects = dbSettings.projectCollection();
    projects.save(project, {safe:true}, function (err, result) {
        if(result.ops) {
            callback(err, result.ops[0]);
        } else {
            callback(err, project);
        }
    });
};

exports.generateDefaultProject = function(company) {
    return {
        name: company.name,
        template: company.template,
        periods: company.periods,
        companyId: company._id
    };
};

//Private
function returnProjectCallback(res, err, savedProject) {
    if(err) {
        res.status(500).json(err);
        return;
    }
    res.json(savedProject);
}