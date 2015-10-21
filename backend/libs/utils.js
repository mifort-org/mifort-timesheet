/*!
 * Copyright 2015 mifort.org
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var ObjectID = require('mongodb').ObjectID;
var moment = require('moment');
var reqParams = require('./req_params');

var dateFormat = 'MM/DD/YYYY';

exports.getStartDate = function(req) {
    return getDateParam(req, reqParams.startDateParam);
};

exports.getEndDate = function(req) {
    return getDateParam(req, reqParams.endDateParam);
}; 

exports.getProjectId = function(req) {
    return getObjectIdParam(req, reqParams.projectIdParam)
};

exports.getUserId = function(req) {
    return getObjectIdParam(req, reqParams.userIdParam);
};

exports.getCompanyId = function(req) {
    return getObjectIdParam(req, reqParams.companyIdParam);
};

exports.getTimelogId = function(req) {
    return getObjectIdParam(req, reqParams.timelogIdParam);
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
            && moment(value, dateFormat).isValid()) {
        return moment(value, dateFormat).format(dateFormat);
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
