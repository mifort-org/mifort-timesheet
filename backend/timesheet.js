var ObjectId = require('mongodb').ObjectID;
var utils = require('./utils');

var dbCollectionName = "timesheets";

exports.getByProjectId = function(db) {
    return function(req, res) {
        var projectId = utils.getProjectId(req, res);
        if(projectId) {
            var timesheets = db.collection(dbCollectionName);
            timesheets.findOne({projectId: projectId}, 
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
    return utils.save(db, dbCollectionName);
}

exports.getCalendarByPeriod = function(db) {
    return function(req, res) {
        var query = getQueryObject(req, res);
        if(query) {
            var timesheets = db.collection(dbCollectionName);
            timesheets.findOne(query[0],
                               query[1], 
                function(err, doc) {
                    if(err) {
                        res.status(500).json(err);
                        return;
                    }
                    if(doc) {
                        console.log(doc);
                        getCalendarByPeriod(timesheets, query[0], doc.periods[0], res);
                    } else{
                        res.json(doc);
                    }
                }
            );
        }
    }
}

function getQueryObject(req, res) {
    var projectId = utils.getProjectId(req, res);
    var periodId = utils.getPeriodId(req, res);
    var currentDate = new Date();
    if(!projectId) {
        return false;
    }

    if(periodId) {
        return [{
                    projectId: projectId, 
                    "periods.id": parseInt(periodId)
                },
                {
                    periods: {$elemMatch: {id: parseInt(periodId)}}
                }];
    } else {
        return [
            {
                projectId: projectId,
                "periods.startDate":{ $lte : currentDate},
                "periods.endDate": {$gte: currentDate}
            },
            {
                periods: {$elemMatch: {startDate: { $lte : currentDate},
                                       endDate: {$gte: currentDate}}}
            }];

    }
}

function getCalendarByPeriod(collection, query, period, res) {
     collection.find(query,
                    {
                        calendar: {$elemMatch: {date: {$gte: period.startDate, $lte: period.endDate}}}
                    },
                    {
                        "sort": "calendar.date"
                    }).toArray(
                        function(err, docs) {
                            if(err) {
                                res.status(500).json(err);
                            }
                            res.json(docs);
                        }
                    );
}