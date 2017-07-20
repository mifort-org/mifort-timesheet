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

var u = require("underscore");
var pdf = require('html-pdf');

var REPORT_COLUMNS = {
    date: 'Date',
    userName: 'User',
    projectName: 'Project',
    role: 'Role',
    time: 'Time',
    comment: 'Comment'
};

var reportDownloadUrlPrefix = '/api/v1/report/download/'; // /api/v1 prefix shoulв be shared

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
exports.restCommonReportCSV = function(req, res, next) {
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


        createCSVFile(cursorStream, REPORT_COLUMNS, function(fileName) {
            log.debug('-REST Result: Download common report. CSV file is generated. Company id: %s',
                filterObj.companyId.toHexString());
            res.json({url: reportDownloadUrlPrefix + fileName});
        });
    });
};

exports.restCommonReportPDF = function(req, res, next) {
    var filterObj = req.body;
    var projectId = filterObj.projectId.toString();

    log.debug('-REST call: Download common report. Company id: %s',
        filterObj.companyId.toHexString());

    var query = convertFiltersToQuery(filterObj.filters, projectId);
    var days = getDatesArray(query.date.$gte, query.date.$lte);
    var calendar = [];
    db.projectCollection().find({_id: query.projectId}).toArray(function (err, logs) {
        if (err) {
            throw err;
        }
        var weekends = [];
        u.each(logs[0].defaultValues, function (item) {
            var dayOff = item.date.toISOString().match(/\d{4}-\d{2}-\d{2}/)[0];
            weekends.push(dayOff);
        });
        u.each(days, function (day) {
            day = day.toISOString().match(/\d{4}-\d{2}-\d{2}/)[0];
            if (u.contains(weekends, day)) {
                calendar.push([day, 0]);
            } else {
                calendar.push([day, logs[0].template.time]);
            }
        });
        console.log(calendar);

    });

    db.timelogCollection().find(query).toArray(function (err, logs) {
        if (err) {
            throw err;
        }
        createPdfFile (logs, calendar, function (fileName) {
            log.debug('-REST Result: Download common report. PDF file is generated. Company id: %s',
                filterObj.companyId.toHexString());
            res.json({url: reportDownloadUrlPrefix + fileName});
        });
    });
};

exports.restDownloadFile = function(req, res, next) {
    var fileName = utils.getFileName(req);
    var ext = fileName.includes('.csv')? '.csv' : '.pdf';
    log.debug('-REST Call: Download file. File is downloaded. %s', fileName);

    res.download('./report_files/' + fileName, 'report' + ext, function(err) {
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
    fillUserValues(companyId, filterValues, next,
        function() {
            fillProjectValues(companyId, filterValues, next,
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
        var countQuery = aggregationArray.slice();
        var pageInfo = {number: filterObj.page, size: filterObj.pageSize};
        aggregationArray.push({$skip: (pageInfo.number - 1) * pageInfo.size});
        aggregationArray.push({$limit: pageInfo.size});

        var aggregationCallback = function(err, groupEntries) {
            groupEntries.forEach(function(entry) {
                return entry.readyForApprove = entry.readyForApprove.every(function(readyForApprove) {return readyForApprove;})
            })
            log.debug('-REST result: aggregation report. Company id: %s', filterObj.companyId.toHexString());
            res.json(groupEntries);
        };

        if(pageInfo.number == 1) {
            //can be optimized - just need to remove sort stage
            countQuery.push({ $group: {_id: null, count: {$sum: 1}}});
            timelogCollection.aggregate(countQuery)
                .next(function(err, countObj) {
                    if(countObj) {
                        res.append('X-Total-Count', countObj.count);
                    }
                    timelogCollection.aggregate(aggregationArray).toArray(aggregationCallback);
                })
        } else {
            timelogCollection.aggregate(aggregationArray).toArray(aggregationCallback);
        }

    });
};

exports.restAggregationReportCSV = function(req, res, next) {
    var filterObj = req.body;
    log.debug('-REST call: aggregation report download CSV. Company id: %s', filterObj.companyId.toHexString());

    var timelogCollection = db.timelogCollection();
    projects.findProjectIdsByCompanyId(filterObj.companyId, function(err, projectIds) {
        if(err) {
            next(err);
            return;
        }

        var aggregationArray = createAggregationArray(filterObj, projectIds);
        var aggregationStream = timelogCollection.aggregate(aggregationArray)
            .stream({
                transform: function(doc) {
                    if(doc.date) {
                        doc.date = utils.formatDate(doc.date);
                    }
                    if(doc.comments && Array.isArray(doc.comments)) {
                        doc.comments = doc.comments.filter(function (comment) {
                            return !!comment;
                        }).join();
                    }
                    return doc;
                }
            });

        var aggregationColumns = filterObj.groupBy;
        aggregationColumns.push('time');
        if(filterObj.isCommentNeeded) {
            aggregationColumns.push('comments');
        }
        createCSVFile(aggregationStream, aggregationColumns, function(fileName) {
            res.json({url: reportDownloadUrlPrefix + fileName}); //version is hardcoded. Shoud be shared
            log.debug('-REST result: aggregation report download CSV. Company id: %s',
                filterObj.companyId.toHexString());
        });
    });
};

//Private
function createGroupBy(fieldNames) {
    var groupBy = {};
    if(fieldNames) {
        fieldNames.forEach(function(fieldName) {
            groupBy[fieldName] = '$'+fieldName;
            if(fieldName === 'userId') {
                groupBy['userName'] = '$userName';
            }
        });
    }
    return groupBy;
}

function createProjection(filterObj) {
    var fieldNames = filterObj.groupBy;
    var projection = {
        time : '$time', _id : 0
    };
    if(filterObj.isCommentNeeded) {
        projection.comments = '$comments';
    }
    if(filterObj.isreadyForApproveNeeded) {
        projection.readyForApprove = '$readyForApprove';
        projection.size = {$size:'$readyForApprove'};
    }
    if(fieldNames) {
        fieldNames.forEach(function(fieldName) {
            projection[fieldName] = '$_id.'+fieldName;
            if(fieldName === 'userId') {
                projection['userName'] = '$_id.userName';
            }
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
                case 'userId':
                    query.userId = {
                        $in: filter.value.map(function(id) {
                            return utils.convertToMongoId(id);
                            })
                        }
                    break;
                default:
                    query[filter.field] = {$in: filter.value};
            }
        });
    }

    if(projectIds) {
        if (typeof(projectIds) == 'object') {
            console.log('obj');
            query.projectId = {$in: projectIds};
        } else {
            console.log('not obj');
            query.projectId = utils.convertToMongoId(projectIds);
        }
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

    var groupBy = createGroupBy(filterObj.groupBy);
    var projection = createProjection(filterObj);
    var aggregationArray = [{$match : query}];
    if(!isObjectEmpty(sorting)) {
        aggregationArray.push({ $sort: sorting });
    }

    var groupObj = { _id: groupBy, time: { $sum:'$time' }};
    if(filterObj.isCommentNeeded) {
        groupObj.comments = { $push: '$comment' };
    }
    if(filterObj.isreadyForApproveNeeded) {
        groupObj.readyForApprove = {$push:'$readyForApprove'};
    }
    aggregationArray.push({ $group: groupObj });
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

function fillUserValues(companyId, filterValues, next, callback) {
    var users = db.userCollection();
    users.find({companyId: companyId},
               {displayName: 1})
        .sort({displayName: 1})
        .toArray(function(err, dbusers) {
            if(!err) {
                filterValues.push({field:'users', value: dbusers});
                callback();
            } else {
                next(err);
            }
        });
}

function fillProjectValues(companyId, filterValues, next, callback) {
    var projects = db.projectCollection();
    projects.find({companyId: companyId},
                  {name: 1, active: 1, _id:0})
            .sort({name: 1})
        .toArray(function(err, projectDtos){
            if(!err) {
                filterValues.push({field:'projects', value: projectDtos});
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

function createCSVFile(outputStream, reportColumns, callback) {
    var csvStringifier = csvStringify({ header: true, columns: reportColumns });
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

function createPdfFile (logs, calendar, callback) {
    var fileName = 'report_' + shortid.generate() + '.pdf';
    var projectName = 'mifort';
    // console.log(logs);
    logs = cleanUpAndUnifyData(logs);

    var htmlPage = generateHtmlData(logs, projectName, calendar);

    writePdf (htmlPage, fileName, function () {
        callback(fileName)
    })
}

function writePdf (html, fileName, callback) {
    var options = { format: 'Letter'};
    pdf.create(html, options).toFile('./report_files/' + fileName, function(err, res) {
        if (err) return console.log(err);
        console.log(res); // { filename: '/app/businesscard.pdf' }
        callback();
    });
}

function generateHtmlData (logs, name, calendar) {

    var project = {
        name: name,
        users: [],
        totalTime: 0
    };
    var workHours = 0;

    u.each(calendar, function (a) {
        if (a[1]) {
            workHours += a[1];
        }
    });

    var period = calendar[0][0] + " - " + calendar[calendar.length-1][0];

    u.chain(logs).pluck('user').uniq().each(function(usr) {
        var userLogs = u.where(logs, {user: usr});
        console.log(usr);
        console.log(userLogs);
        var user = {};
        user.name = usr;
        user.days = [];
        var totalTime = 0;
        u.each(calendar, function (cal) {
            var date = new Date(cal[0]).toISOString().match(/\d{4}-\d{2}-\d{2}/)[0];
            var log = u.findWhere(userLogs, {date: date});
            var day = {};
            if (!log) {
                day = {
                    date: date,
                    time: 0,
                    comment: '',
                    expectHours: cal[1]
                };
            } else {
                day = {
                    date: date,
                    time: log.time,
                    comment: log.comment,
                    expectHours: cal[1]
                };
            }
            user.days.push(day);
            totalTime += day.time || 0;
        });
        user.totalTime = totalTime;
        project.users.push(user);
        project.totalTime += user.totalTime;
    });

    var htmlData = {
        project: project,
        workHours: workHours,
        period: period
    };

    var template = fs.readFileSync("report_files/projectsTemplate.html").toString();
    var compiled = u.template(template);
    var page = compiled(htmlData);

    return page;
}

function cleanUpAndUnifyData (logs) {

    function extractSensibleData(line) {
        var date = new Date(line.date).toISOString().match(/\d{4}-\d{2}-\d{2}/);
        return {
            date: date ? date[0] : null,
            project: line.projectName,
            time: line.time,
            user: line.userName,
            comment: line.comment
        }
    }
    function sumTimeAndConcatComments(times) {
        return u.reduce(times, function (memo, item) {
            memo.time += (item.time || 0);

            if (item.comment) {
                if (memo.comment) {
                    memo.comment += "; ";
                }

                memo.comment += item.comment;
            }

            return memo;
        }, {
            user: times[0].user,
            project: times[0].project,
            date: times[0].date,
            time: 0,
            comment: ""
        })
    }
    return u.chain(logs)
        .map(extractSensibleData)
        // .filter(function (l) { return users.indexOf(l.user) != -1})
        .filter(function (l) { return l.date.match(new RegExp("\\d{4}-" + "\\d{2}" + "-\\d{2}")) != null })
        .groupBy(function (l) { return [l.user, l.project, l.date].join("-") })
        .mapObject(sumTimeAndConcatComments)
        .values()
        .value();
}

function getDatesArray (startDate, endDate) {
    var dates = [];
    var currentDate = startDate;
    function addDays(current) {
            var date = new Date(current.valueOf());
            date.setDate(date.getDate() + 1);
            return date;
        };
    while (currentDate <= endDate) {
        dates.push(currentDate);
        currentDate = addDays(currentDate);
    }
    return dates;
}
