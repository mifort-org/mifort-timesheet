var utils = require('./libs/utils');
var dbSettings = require('./libs/mongodb_settings');

exports.save = function(req, res) {
    if(req.body) {
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
    }
};

exports.getByDates = function(req, res) {
    var start = utils.getStartDate(req, res);
    var end = utils.getEndDate(req, res);
    var userId = utils.getUserId(req, res);

    if(start && end && userId) {
        var timelogCollection = dbSettings.timelogCollection();
        var query = {
            userId : userId,
            date : {$gte: start,
                    $lte: end}
        };

        timelogCollection.find(query, {'sort': 'date'}).toArray(function(err, timelogs){
            returnTimelogArray(err, res, timelogs);
        });
    }
};

//private part
function findAllByIds(ids, callback) {
    var timelogCollection = dbSettings.timelogCollection();
    timelogCollection.find({_id:{ $in: ids}}, {"sort": "date"}).toArray(function(err, timelogs) {
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