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
    return getObjectIdParam(req, res, 'projectId')
};

exports.getUserId = function(req, res) {
    return getObjectIdParam(req, res, 'userId');
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
            col.save(object, {safe:true}, function (err, result) {
               sendSavedObject(err, res, object, result);
            });
        } else {
            res.status(500).json({error: "Empty body"});
        }
    };
};

//parse json. Date and ObjectId
exports.jsonParse = function(key, value) {
    if (typeof value === 'string' ) {
        if (key.toLowerCase().indexOf('date') > -1
                && moment(value).isValid()) {
            return moment(value, dateFormat).toDate();
        }
        var keyName = key.toLowerCase();
        var isIdField = keyName == '_id' 
                        || keyName == 'userId' 
                        || keyName == 'projectId'
                        || keyName == 'companyId';
        if(isIdField && ObjectID.isValid(value)) {
            return new ObjectID(value);
        }
    }    
    return value;
};

//private section
function getObjectIdParam(req, res, name) {
    var entityObjectId = getParameter(req, res, name);
    if(entityObjectId && ObjectID.isValid(entityObjectId)) {
        entityObjectId = new ObjectID(entityObjectId);
    } else {
        res.status(500).json({error: 'Invalid ' + name + ' format!'});
        entityObjectId = false;
    }
    return entityObjectId;
}

function sendSavedObject(err, res, object, result) {
    if(err) {
        res.status(500).json(err);
    } else { 
        if(result.result.ok) {
            if(result.ops) {
                res.json(result.ops[0]);
            } else {
                res.json(object);
            }
        }    
    }
}

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