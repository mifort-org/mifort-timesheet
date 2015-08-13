var ObjectId = require('mongodb').ObjectID;
var utils = require('./utils');

//extract to separate file: db-management
exports.save = function(db) {
    return utils.save(db, "timelogs");
};

exports.getForPeriod = function(db) {
    return function(req, res) {
        var periodIdP = utils.getPeriodId(req, res);
        var userIdP = utils.getUserId(req, res);
        if(periodIdP && userIdP) {
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