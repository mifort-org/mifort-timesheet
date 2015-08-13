var ObjectId = require('mongodb').ObjectID;
var utils = require('./utils');

exports.getByProjectName = function(db) {
    return function(req, res) {
        var projectId = utils.getProjectId(req, res);
        if(projectId) {
            var projects = db.collection('projects');
            projects.findOne({_id: new ObjectId(projectId)}, 
                            {calendar:1, periods:1}, 
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

exports.save = function(db) {
    return utils.save(db, "projects");
}

exports.getCalendarByPeriod = function(db) {
    return function(req, res) {
        var periodId = utils.getPeriodId(req, res);
        var projectId = utils.getProjectId(req, res);
        if(periodId  && projectId) {
            var projects = db.collection('projects');
            projects.findOne({ //query
                                _id : new ObjectId(projectId), 
                             "periods.id": parseInt(periodId)
                             }, 
                             { // what is needed to select
                                periods: {$elemMatch: {id: parseInt(periodId)}}
                             }, 
                function(err, doc) {
                    if(err) {
                        res.status(500).json(err);
                        return;
                    }
                    getCalendarByPeriod(projects, projectId, doc.periods[0], res);
                }
            );
        }
    }
}

function getCalendarByPeriod(collection, projectId, period, res) {
     collection.find({
                        _id: new ObjectId(projectId),
                    },
                    {
                        calendar: {$elemMatch: {dateId:{
                                $lte: period.endDateId,
                                $gte: period.startDateId
                            }}
                        }
                    },
                    {
                        "sort": "dateId"
                    }).toArray(
                        function(err, docs) {
                            if(err) {
                                res.status(500).json(err);
                            }
                            res.json(docs);
                        }
                    );
}