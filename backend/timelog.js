var ObjectId = require('mongodb').ObjectID;
var utils = require('./utils');

var timelogCollectionName = 'timelogs';
var timesheetCollectionName = 'timesheets';

exports.save = function(db) {
    return utils.save(db, timelogCollectionName);
};

exports.getForPeriod = function(db) {
    return function(req, res) {
        getCurrentPeriod(req, res, db, findTimeLog);
    }
}

function getCurrentPeriod(req, res, db, callback) {
    var query = getPeriodQueryObject(req, res);
    if(query) {
        var timesheets = db.collection(timesheetCollectionName);
        timesheets.findOne(query[0],
                           query[1], 
                function(err, doc) {
                    if(err) {
                        res.status(500).json(err);
                        return;
                    }
                    if(doc) {
                        console.log(doc);
                        callback(req, res, db, doc.periods[0]);
                    } else{
                        res.status(400).json({});
                    }
                }
            );
    } else {
        res.status(500).json({error: "Empty parameters"});
    }
}

function findTimeLog(req, res, db, period) {
    var userId = utils.getUserId(req, res);
    var projectId = utils.getProjectId(req, res);
    if(userId && period && projectId) {
        var timelogs = db.collection(timelogCollectionName);
        timelogs.findOne({userId : parseInt(userId), //dangerous
                          periodId: period.id,
                          projectId: projectId},
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

function getPeriodQueryObject(req, res) {
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