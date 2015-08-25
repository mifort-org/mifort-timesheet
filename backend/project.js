var dbSettings = require('./libs/mongodb_settings');
var utils = require('./libs/utils');

exports.getById = function(req, res) {
    var projectId = utils.getProjectId(req, res);
    if(projectId) {
        var projects = dbSettings.projectCollection();
        projects.findOne({projectId: projectId}, 
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

exports.save = utils.saveObject(dbSettings.projectCollection);
