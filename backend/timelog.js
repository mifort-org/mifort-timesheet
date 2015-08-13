var ObjectId = require('mongodb').ObjectID;
var utils = require('./utils');

//extract to separate file: db-management
exports.save = function(db) {
    return function(req, res) {
        console.log(req.body);
        if(req.body) {
            console.log(req.body);
            var currentDate = new Date();
            var project = req.body;
            if(!project.createdOn) {
                project.createdOn = currentDate;
            }
            project.updatedOn = currentDate;
            var projects = db.collection('timelogs');
            projects.save(project, {safe:true}, function (err, results) {
                if(err) {
                    res.status(500).json(err);
                } else {
                    console.log(results);
                    res.json(results.ops[0]);
                }
            });
        } else {
            res.status(500).json({"error": "Cannot save empty object"});
        }
    }
};

exports.getForPeriod = function(db) {
    return function(req, res) {
        var periodIdP = utils.getPeriodId(req, res);
        var userIdP = utils.getUserId(req, res);
        if(periodIdP) {
            var timelogs = db.collection('timelogs');
            timelogs.findOne({userId : parseInt(userIdP), //dangerous
                              periodId: parseInt(periodIdP) }, //dangerous
                function(err, doc) {
                    if(err) {
                        res.status(500).json(err);
                        return;
                    }
                    res.json(doc);
                }
            );
        }
    }
}