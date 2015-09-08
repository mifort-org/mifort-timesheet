var dbSettings = require('./libs/mongodb_settings');
var ObjectID = require('mongodb').ObjectID;
var utils = require('./libs/utils');

exports.getById = function(req, res) {
    var projectId = utils.getProjectId(req, res);
    if(projectId) {
        if(ObjectID.isValid(projectId)) {
            var projects = dbSettings.projectCollection();
            projects.findOne({_id: new ObjectID(projectId)}, 
                function(err, doc) {
                    if(err) {
                        res.status(500).json(err);
                        return;
                    }
                    res.json(doc);
                }
            );
        } else {
            res.status(500).json({error: 'Invalid project ID format!'});
        }
    }
};

exports.save = utils.saveObject(dbSettings.projectCollection);

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