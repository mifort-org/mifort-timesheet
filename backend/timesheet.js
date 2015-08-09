var ObjectId = require('mongodb').ObjectID;

exports.getByProjectName = function(db) {
    return function(req, res) {
        var projectId = req.params.id;
        if(!projectId) {
            res.status(400).json({ error: 'Project ID is not specified!' });
            return;
        }

        var projects = db.collection('projects');
        projects.find({_id: new ObjectId(projectId)}, 
                      {calendar:1, periods:1})
            .toArray(function(err, docs) {
                if(err) {
            	   res.status(500).json(err);
                    return;
                }
                res.json(docs);
            }
        );
    }
}

exports.save = function(db) {
    return function(req, res) {
        if(req.body) {
            console.log(req.body);
            var currentDate = new Date();
            var project = req.body;
            if(!project.createdOn) {
                project.createdOn = currentDate;
            }
            project.updatedOn = currentDate;
            var projects = db.collection('projects');
            projects.save(project, {safe:true}, function (err, results) {
                if(err) {
                    res.status(500).json(err);
                } else {
                    console.log(results);
                    res.json(results.ops[0]);
                }
            });
        }
    }
}