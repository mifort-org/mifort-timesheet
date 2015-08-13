exports.getPeriodId = function(req, res) {
    var periodId = req.query.periodId;
    if(!periodId) {
        res.status(400).json({ error: 'Period ID is not specified!' });
    }
    return periodId;
};

exports.getProjectId = function(req, res) {
    var projectId = req.params.id;
    if(!projectId) {
        res.status(400).json({ error: 'Project ID is not specified!' });
    }
    return projectId;
};

exports.getUserId = function(req, res) {
    var userId = req.params.userId;
    if(!userId) {
        res.status(400).json({ error: 'User ID is not specified!' });
    }
    return userId;
};

exports.save = function(db, collectionName) {
    return function(req, res) {
        if(req.body) {
            console.log(req.body);
            var currentDate = new Date();
            var project = req.body;
            if(!project.createdOn) {
                project.createdOn = currentDate;
            }
            project.updatedOn = currentDate;
            var projects = db.collection(collectionName);
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
};