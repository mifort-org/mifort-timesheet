var ObjectID = require('mongodb').ObjectID;
var moment = require('moment');
var dateFormat = "MM-DD-YYYY";

exports.getStartDate = function(req, res) {
    return getDateParam(req, res, 'startDate');
};

exports.getEndDate = function(req, res) {
    return getDateParam(req, res, 'endDate');
}; 

exports.getProjectId = function(req, res) {
    return getParameter(req, res, 'projectId');
};

//parse json. Date and ObjectId
exports.jsonParse = function(key, value) {
    if (typeof value === 'string' ) {
        if (key.toLowerCase().indexOf('date') > -1) {
            return moment(value, dateFormat).toDate();
        }
        if(key.toLowerCase() == '_id' && ObjectID.isValid(value)) {
            return new ObjectID(value);
        }
    }    
    return value;
};

//private section
function getDateParam(req, res, name) {
    var date = getParameter(req, res, name);
    if(date) {
        return moment(date, dateFormat).toDate();
    }
};

function getParameter(req, res, name) {
    var param = req.params[name] || req.query[name];
    if(!param) {
        res.status(400).json({ error: name + ' is not specified!' });
    }
    return param;
}

//deprecated
exports.getPeriodId = function(req, res) {
    var periodId = req.params.periodId || req.query.periodId;
    return periodId;
};

//from session or from param???
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
            return moment(value, dateFormat).toDate();
        }
        if(key.toLowerCase() == '_id' && ObjectID.isValid(value)) {
            return new ObjectID(value);
        }
    }    
    return value;
};