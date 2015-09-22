var dbSettings = require('./libs/mongodb_settings');
var utils = require('./libs/utils');

//Rest API
exports.restGetById = function(req, res) {
    var projectId = utils.getProjectId(req, res);
    if(projectId) {
        var projects = dbSettings.projectCollection();
        projects.findOne({_id: projectId}, 
            function(err, doc) {
                if(err) {
                    res.status(500).json(err);
                    return;
                }
                res.json(doc);
            }
        );
    }
};

exports.restSave = utils.restSaveObject(dbSettings.projectCollection);

exports.restGetByCompanyId = function(req, res) {
    var companyId = utils.getCompanyId(req, res);
    if(companyId) {
        var projects = dbSettings.projectCollection();
        projects.find({companyId: companyId}).toArray(function(err, findedProjects){
            if(err) {
                res.status(400).json({error: 'Cannot find projects!'});
            } else {
                res.json(findedProjects);
            }
        });
    }
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