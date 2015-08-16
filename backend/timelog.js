var ObjectId = require('mongodb').ObjectID;
var utils = require('./utils');

var dbCollectionName = 'timelogs';

exports.save = function(db) {
    return utils.save(db, dbCollectionName);
};

exports.getForPeriod = function(db) {
    return function(req, res) {
        var periodIdP = utils.getPeriodId(req, res);
        var userIdP = utils.getUserId(req, res);
        if(periodIdP && userIdP) {
            var timelogs = db.collection(dbCollectionName);
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