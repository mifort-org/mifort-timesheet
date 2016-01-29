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
 *
 * @author Andrew Voitov
 */
var csvStringify = require('csv-stringify');
var fs = require('fs');
var shortid = require('shortid');

var db = require('./libs/mongodb_settings');
var log = require('./libs/logger');
var utils = require('./libs/utils');

var projects = require('./project');
var company = require('./company');

var REPORT_COLUMNS = {
    date: 'Date',
    userName: 'User',
    projectName: 'Project',
    role: 'Role',
    time: 'Time'
};

//Rest API
exports.restCommonReport = function(req, res, next) {
    var filterObj = req.body;
    log.debug('-REST call: common report. Company id: %s', filterObj.companyId.toHexString());

    projects.findProjectIdsByCompanyId(filterObj.companyId, function(err, projectIds) {
        if(err) {
            next(err);
            return;
        }
        var query = convertFiltersToQuery(filterObj.filters, projectIds);
        var sorting = convertToSortQuery(filterObj.sort);
        var pageInfo = {number: filterObj.page, size: filterObj.pageSize};
        var filterCallback = function() {
            log.debug('-REST result: common report. Company id: %s',
                filterObj.companyId.toHexString());
        };

        if(pageInfo.number == 1) {
            var timelogCollection = db.timelogCollection();
            timelogCollection.find(query)
                .count(function(err, count) {
                    res.append('X-Total-Count', count);
                    filterTimelog(query, sorting, pageInfo, res, filterCallback);
                });
        } else {
            filterTimelog(query, sorting, pageInfo, res, filterCallback);
        }
    });
};

//need to extract common parts to separate method!!!!
exports.restConstructCSV = function(req, res, next) {
    var filterObj = req.body;
    log.debug('-REST call: Download common report. Company id: %s',
        filterObj.companyId.toHexString());

    var timelogCollection = db.timelogCollection();
    projects.findProjectIdsByCompanyId(filterObj.companyId, function(err, projectIds) {
        if(err) {
            next(err);
            return;
        }
        var query = convertFiltersToQuery(filterObj.filters, projectIds);
        var sorting = convertToSortQuery(filterObj.sort);

        var cursorStream = timelogCollection.find(query)
            .sort(sorting)
            .stream({
                transform: function(doc) {
                    if(doc.date) {
                        doc.date = utils.formatDate(doc.date);
                    }
                    return doc;
                }
            });

        createCSVFile(cursorStream, function(fileName) {
            log.debug('-REST Result: Download common report. CSV file is generated. Company id: %s',
                filterObj.companyId.toHexString());
            res.json({url: '/report/download/' + fileName});
        });
    });
};

exports.restDownloadFile = function(req, res, next) {
    var fileName = utils.getFileName(req);
    log.debug('-REST Call: Download file. File is downloaded. %s', fileName);

    res.download('./report_files/' + fileName, 'report.csv', function(err) {
        if(err) {
            next(err);
            return;
        }
        if(res.headersSent) {
            fs.unlink('./report_files/' + fileName, function(err) {
                if (err) {
                    log.warn('Cannot delete %s', fileName);
                } else {
                    log.info('Successfully deleted %s', fileName);
                }
            });
        }
        log.debug('-REST Result: Download file. File is downloaded. %s', fileName);
    })
};

exports.restGetFilterValues = function(req, res, next) {
    var companyId = utils.getCompanyId(req);
    log.debug('-REST call: Get filter values. Company id: %s', companyId.toHexString());

    var filterValues = [];
    fillUserNameValues(companyId, filterValues, next,
        function() {
            fillProjectNameValues(companyId, filterValues, next,
                function() {
                    fillRoleValues(companyId, filterValues,
                        function() {
                            res.json(filterValues);
                            log.debug('-REST result: Report filters returned. Company id: %s',
                                companyId.toHexString());
                        }
                    );
                }
            );
        }
    );
};

exports.restAggregationReport = function(req, res, next) {
    var filterObj = req.body;
    log.debug('-REST call: aggregation report. Company id: %s', filterObj.companyId.toHexString());

    var timelogCollection = db.timelogCollection();
    projects.findProjectIdsByCompanyId(filterObj.companyId, function(err, projectIds) {
        if(err) {
            next(err);
            return;
        }

        var aggregationArray = createAggregationArray(filterObj, projectIds);

        timelogCollection.aggregate(aggregationArray)
            .toArray(function(err, groupEntries) {
                log.debug('-REST result: aggregation report. Company id: %s', filterObj.companyId.toHexString());
                res.json(groupEntries);
            });
    });
};

//Private
function createGroupBy(fieldNames) {
    var groupBy = {};
    if(fieldNames) {
        fieldNames.forEach(function(fieldName) {
            groupBy[fieldName] = '$'+fieldName;
        });
    }
    return groupBy;
}

function createProjection(fieldNames) {
    var projection = {
        time : '$time', _id : 0
    };
    if(fieldNames) {
        fieldNames.forEach(function(fieldName) {
            projection[fieldName] = '$_id.'+fieldName;
        });
    }
    return projection;
}

function convertFiltersToQuery(filters, projectIds) {
    var query = {};
    if(filters) {
        filters.forEach(function(filter) {
            switch(filter.field) {
                case 'date':
                    query.date = {$gte: filter.start,
                                  $lte: filter.end};
                    break;
                default:
                    query[filter.field] = {$in: filter.value};
            }
        });
    }
    //skip all empty timelogs
    if(!query.time) {
        query.time = {$gt: 0};
    }
    if(projectIds) {
        query.projectId = {$in: projectIds};
    }

    return query;
}

function convertToSortQuery(sort) {
    var sortObj = {};
    if(sort) {
        sortObj[sort.field] = (sort.asc ? 1 : -1);
    }

    return sortObj;
}

function createAggregationArray(filterObj, projectIds) {
    var query = convertFiltersToQuery(filterObj.filters, projectIds);
    //Prepare sorting params
    var sorting = convertToSortQuery(filterObj.sort);
    var postGroupSort = {};
    if(sorting.time) {
        postGroupSort.time = sorting.time;
    }
    delete sorting.time;

    var pageInfo = {number: filterObj.page, size: filterObj.pageSize};
    var groupBy = createGroupBy(filterObj.groupBy);
    var projection = createProjection(filterObj.groupBy);

    var aggregationArray = [{$match : query}];
    if(!isObjectEmpty(sorting)) {
        aggregationArray.push({ $sort: sorting });
    }
    aggregationArray.push({ $group: { _id: groupBy, time: { $sum:'$time' }} });
    if(!isObjectEmpty(postGroupSort)) {
        aggregationArray.push({ $sort: postGroupSort });
    }
    aggregationArray.push({ $project : projection });
    return aggregationArray;
}

function isObjectEmpty(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
}

function filterTimelog(query, sortObj, pageInfo, res, callback) {
    var timelogCollection = db.timelogCollection();
    timelogCollection.find(query)
        .sort(sortObj)
        .skip((pageInfo.number - 1) * pageInfo.size) // not efficient way but It's just for the first implementation
        .limit(pageInfo.size)
        .toArray(function(err, timelogs) {
            res.json(timelogs);
            callback();
        });
}

function fillUserNameValues(companyId, filterValues, next, callback) {
    var users = db.userCollection();
    users.find({companyId: companyId},
               {displayName: 1})
        .sort({displayName: 1})
        .toArray(function(err, userNames) {
            if(!err) {
                var displayNames = userNames.map(function(user){
                    return user.displayName;
                });
                filterValues.push({field:'userName', value: displayNames});
                callback();
            } else {
                next(err);
            }
        });
}

function fillProjectNameValues(companyId, filterValues, next, callback) {
    var projects = db.projectCollection();
    projects.find({companyId: companyId},
                  {name: 1})
            .sort({name: 1})
        .toArray(function(err, projectDtos){
            if(!err) {
                var projectNames = projectDtos.map(function(projectDto){
                    return projectDto.name;
                });
                filterValues.push({field:'projectName', value: projectNames});
                callback();
            } else {
                next(err);
            }
        });
}

function fillRoleValues(companyId, filterValues, callback) {
    filterValues.push({field:'role', value: company.defaultPositions});
    callback();
}

function createCSVFile(outputStream, callback) {
    var csvStringifier = csvStringify({ header: true, columns: REPORT_COLUMNS });
    var fileName = 'report_' + shortid.generate() + '.csv';
    var writeStream = fs.createWriteStream('./report_files/' + fileName,
        {defaultEncoding: 'utf8'});

    outputStream.pipe(csvStringifier).pipe(writeStream);

    outputStream.on('end', function() {
        callback(fileName);
    });

    writeStream.on('error', function (err) {
        log.error(err);
    });
}
