var ObjectID = require('mongodb').ObjectID;
var moment = require('moment');

var dateFormat = 'MM/DD/YYYY';

var startDateParam = 'startDate';
var endDateParam = 'endDate';
var projectIdParam = 'projectId';
var userIdParam = 'userId';
var companyIdParam ='companyId';
var timelogIdParam = 'timelogId';

exports.getStartDate = function(req) {
    return getDateParam(req, startDateParam);
};

exports.getEndDate = function(req) {
    return getDateParam(req, endDateParam);
}; 

exports.getProjectId = function(req) {
    return getObjectIdParam(req, projectIdParam)
};

exports.getUserId = function(req) {
    return getObjectIdParam(req, userIdParam);
};

exports.getCompanyId = function(req) {
    return getObjectIdParam(req, res, companyIdParam);
};

exports.getTimelogId = function(req) {
    return getObjectIdParam(req, timelogIdParam);
};

//parse json. Date and ObjectId
exports.jsonParse = function(key, value) {
    if (typeof value === 'string') {
        if (key.toLowerCase().indexOf('date') > -1
                && moment(value, dateFormat).isValid()) {
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

//private section
function getObjectIdParam(req, name) {
    var entityObjectId = getParameter(req, name);
    if(entityObjectId && ObjectID.isValid(entityObjectId)) {
        entityObjectId = new ObjectID(entityObjectId);
    }
    return entityObjectId;
}

function getDateParam(req, name) {
    var date = getParameter(req, name);
    if(date) {
        return moment(date, dateFormat).toDate();
    }
};

function getParameter(req, name) {
    return req.params[name] || req.query[name];
}
