var utils = require('./libs/utils');
var dbSettings = require('./libs/mongodb_settings');
var ObjectID = require('mongodb').ObjectID;

//Rest API
exports.restSave = function(req, res) {
    var timelogCollection = dbSettings.timelogCollection();
    var batch = timelogCollection.initializeUnorderedBulkOp({useLegacyOps: true});
    
    var ids = [];
    var timelogs = req.body.timelog;
    timelogs.forEach(function(log) {
        if(log._id) {
            batch.find({_id: log._id}).upsert().replaceOne(log);
        } else {
            batch.insert(log);
        }
        ids.push(log._id);
    });

    batch.execute(function(err, result) {
        findAllByIds(ids, function(err, timelogs) {
            returnTimelogArray(err, res, timelogs);
        });
    });
};

exports.restDelete = function(req, res) {
    var timelogId = utils.getTimelogId(req);
    var timelogCollection = dbSettings.timelogCollection();
    timelogCollection.remove({_id:timelogId}, {single: true},
      function(err, numberOfDeleted){
        if(err) {
            res.status(500).json({error: 'Cannot delete timelog'});
        } else {
            res.json({ok: true});
        }
    });
};

exports.restGetByDates = function(req, res) {
    var start = utils.getStartDate(req);
    var end = utils.getEndDate(req);
    var userId = utils.getUserId(req);
    var projectId = utils.getProjectId(req);

    var timelogCollection = dbSettings.timelogCollection();
    var query = {
        userId : userId,
        projectId: projectId,
        date : {$gte: start,
                $lte: end}
    };

    timelogCollection.find(query, {'sort': 'date'}).toArray(function(err, timelogs){
        returnTimelogArray(err, res, timelogs);
    });
};

//Private part
function findAllByIds(ids, callback) {
    var timelogCollection = dbSettings.timelogCollection();
    timelogCollection.find({_id:{ $in: ids}}, {'sort': 'date'}).toArray(function(err, timelogs) {
        callback(err, timelogs);
    });
}

function returnTimelogArray(err, res, timelogs) {
    if(err) {
        res.status(500).json(err);
        return;
    }
    res.json({timelog: timelogs});
}