var ObjectID = require('mongodb').ObjectID;
var moment = require('moment');

var dateFormat = 'MM/DD/YYYY';

var startDateParam = 'startDate';
var endDateParam = 'endDate';
var projectIdParam = 'projectId';
var userIdParam = 'userId';
var companyIdParam ='companyId';
var timelogIdParam = 'timelogId';

exports.getStartDate = function(req, res) {
    return getDateParam(req, res, startDateParam);
};

exports.getEndDate = function(req, res) {
    return getDateParam(req, res, endDateParam);
}; 

exports.getProjectId = function(req, res) {
    return getObjectIdParam(req, res, projectIdParam)
};

exports.getUserId = function(req, res) {
    return getObjectIdParam(req, res, userIdParam);
};

exports.getCompanyId = function(req, res) {
    return getObjectIdParam(req, res, companyIdParam);
};

exports.getTimelogId = function(req, res) {
    return getObjectIdParam(req, res, timelogIdParam);
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

//parse json. Date and ObjectId
exports.jsonParse = function(key, value) {
    if (typeof value === 'string') {
        if (key.toLowerCase().indexOf('date') > -1
                && moment(value, dateFormat).isValid()) {
            console.log(value);
            return moment(value, dateFormat).toDate();
        }
        var isIdField = key === '_id' //maybe should be some prefix/postfix ???
                        || key === 'userId' 
                        || key === 'projectId'
                        || key === 'companyId';
        if(isIdField && ObjectID.isValid(value)) {
            return new ObjectID(value);
        }
    }
    return value;
};

exports.jsonStringify = function(key, value) {
    var keyName = key.toLowerCase();
    var isDateField = keyName.indexOf('date') > -1
        || keyName === 'start'
        || keyName === 'end'
    if (isDateField
            && moment(value).isValid()) {
        return moment(value).format(dateFormat);
    }
    return value;
};

//Common Rest API
exports.restSaveObject = function(collection) {
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