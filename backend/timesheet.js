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
                        res.json({calendar: getCalendarByPeriod(doc.calendar, doc.periods[0]) });
                    } else{
                        res.status(400).json({});
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
                    periods: {$elemMatch: {id: parseInt(periodId)}},
                    calendar: 1
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
                                       endDate: {$gte: currentDate}}},
                calendar: 1
            }];

    }
}

function getCalendarByPeriod(calendar, period) {
    var calendarForPeriod = calendar.filter(function(day) {
        return day.date <= period.endDate && day.date >= period.startDate; 
    });
    return calendarForPeriod;
}