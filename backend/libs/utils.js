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

//from session or from param???
exports.getUserId = function(req, res) {
    return getParameter(req, res, 'userId');
};

exports.saveObject = function(collection) {
    return function(req, res) {
        if(req.body) {
            var currentDate = new Date();
            var object = req.body;
            if(!object.createdOn) {
                object.createdOn = currentDate;
            }
            object.updatedOn = currentDate;
            var col = collection();
            col.save(object, {safe:true}, function (err, results) {
                if(err) {
                    res.status(500).json(err);
                } else {
                    console.log(results);
                    res.json(results.ops[0]);
                }
            });
        } else {
            res.status(500).json({error: "Empty body"});
        }
    };
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