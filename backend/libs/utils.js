var ObjectID = require('mongodb').ObjectID;
var moment = require('moment');

exports.getPeriodId = function(req, res) {
    var periodId = req.params.periodId || req.query.periodId;
    //????
    // if(!periodId) {
    //     res.status(400).json({ error: 'Period ID is not specified!' });
    // }
    return periodId;
};

exports.getProjectId = function(req, res) {
    var projectId = req.params.projectId || req.query.projectId;
    if(!projectId) {
        res.status(400).json({ error: 'Project ID is not specified!' });
    }
    return projectId;
};

exports.getUserId = function(req, res) {
    var userId = req.params.userId || req.query.userId;
    if(!userId) {
        res.status(400).json({ error: 'User ID is not specified!' });
    }
    return userId;
};

exports.save = function(collection) {
    return function(req, res) {
        if(req.body) {
            console.log(req.body);
            var currentDate = new Date();
            var object = req.body;
            if(!object.createdOn) {
                object.createdOn = currentDate;
            }
            object.updatedOn = currentDate;
            collection().save(object, {safe:true}, function (err, results) {
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

exports.jsonParse = function(key, value) {
    if (typeof value === 'string' ) {
        if (key.toLowerCase().indexOf('date') > -1) {
            return moment(value, "MM-DD-YYYY").toDate();
        }
        if(key.toLowerCase() == '_id' && ObjectID.isValid(value)) {
            return new ObjectID(value);
        }
    }    
    return value;
}