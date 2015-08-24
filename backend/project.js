var utils = require('./libs/utils');
var dbSettings = require('./libs/mongodb_settings');

exports.getByProjectId = function(req, res) {
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

exports.save = function(req, res) {
    if(req.body) {
        var currentDate = new Date();
        var object = req.body;
        if(!object.createdOn) {
            object.createdOn = currentDate;
        }
        object.updatedOn = currentDate;
        collection().save(object, {safe:true}, function (err, results) {
            if(err) {
                res.status(500).json(err);
            } else {
                console.log(results);
                res.json(results.ops[0]);
            }
        });
    } else {
        res.status(500).json({error: "Empty body"});
    }
};
