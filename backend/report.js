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

//Rest API
exports.restCommonReport = function(req, res, next) {
    var filterObj = req.body;
    log.debug('-REST call: common report. Company id: %s', filterObj.companyId.toHexString());

    projects.findProjectIdsByCompanyId(filterObj.companyId, function(err, projectIds) {
        if(err) {
            next(err);
            return;
        }
        var projectIdArray = projectIds.map(function(object) {
            return object._id;
        });
        var query = convertFiltersToQuery(filterObj.filters);
        var sortObj = makeSortObject(filterObj.sort);
        var page = filterObj.page;

        if(page == 1) {
            var timelogCollection = db.timelogCollection();
            timelogCollection.find(query)
                .count(function(err, count) {
                    res.append('X-Total-Count', count);
                    filterTimelog(query, sortObj, page, filterObj.pageSize, res,
                        function() {
                            log.debug('-REST result: common report. Company id: %s',
                                filterObj.companyId.toHexString());
                        });
                });
        } else {
            filterTimelog(query, sortObj, page, filterObj.pageSize, res,
                function() {
                    log.debug('-REST result: common report. Company id: %s',
                        filterObj.companyId.toHexString());
                });
        }

    });
};

var columns = {
    date: 'Date',
    userName: 'User',
    projectName: 'Project',
    role: 'Role',
    time: 'Time'
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
        var projectIdArray = projectIds.map(function(object) {
            return object._id;
        });
        var query = convertFiltersToQuery(filterObj.filters);
        var sortObj = makeSortObject(filterObj.sort);

        var cursorStream = timelogCollection.find(query)
            .sort(sortObj)
            .stream({
                transform: function(doc) {
                    if(doc.date) {
                        doc.date = utils.formatDate(doc.date);
                    }
                    return doc;
                }
            });
        var csvStringifier = csvStringify({ header: true, columns: columns });
        var fileName = 'report_' + shortid.generate() + '.csv';
        var writeStream = fs.createWriteStream('./report_files/' + fileName,
            {defaultEncoding: 'utf8'});

        cursorStream.pipe(csvStringifier).pipe(writeStream);

        cursorStream.on('end', function() {
            log.debug('-REST Result: Download common report. CSV file is generated. Company id: %s',
                filterObj.companyId.toHexString());
            res.json({url: '/report/download/' + fileName});
        });

        writeStream.on('error', function (err) {
            log.error(err);
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
        } else {
            if(res.headersSent) {
                fs.unlink('./report_files/' + fileName, function(err) {
                    if (err) {
                        log.warn('Cannot delete %s', fileName);
                    } else {
                        log.info('Successfully deleted %s', fileName);
                    }
                });
            }
        }
        log.debug('-REST Result: Download file. File is downloaded. %s', fileName);
    })
};

exports.restGetFilterValues = function(req, res, next) {
    var companyId = utils.getCompanyId(req);
    log.debug('-REST call: Get filter values. Company id: %s', companyId.toHexString());

    var timelogCollection = db.timelogCollection();
    var filterValues = [];

    projects.findProjectIdsByCompanyId(companyId, function(err, projectIds) {
        if(err) {
            next(err);
            return;
        }

        var projectIdArray = projectIds.map(function(object) {
            return object._id;
        });
        timelogCollection.distinct('userName', {projectId : {$in: projectIdArray}},
            function(err, userNames){
                if(err) {
                    next(err);
                    return;
                }
                filterValues.push({field:'userName', value: userNames});

                timelogCollection.distinct('projectName', {projectId : {$in: projectIdArray}},
                    function(err, projectNames){
                        if(err) {
                            next(err);
                            return;
                        }
                        filterValues.push({field:'projectName', value: projectNames});

                        timelogCollection.distinct('role', {projectId : {$in: projectIdArray}},
                            function(err, roles){
                                if(err) {
                                    next(err);
                                    return;
                                }
                                filterValues.push({field:'role', value: roles});
                                res.json(filterValues);
                                log.debug('-REST result: Report filters returned. Company id: %s',
                                    companyId.toHexString());
                            });
                    });
            });
    });

};

//Private
function convertFiltersToQuery(filters){
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

    return query;
}

function makeSortObject(sort) {
    var sortObj = {};
    if(sort) {
        sortObj[sort.field] = (sort.asc ? 1 : -1);
    }

    return sortObj;
}

function filterTimelog(query, sortObj, page, pageSize, res, callback) {
    var timelogCollection = db.timelogCollection();
    timelogCollection.find(query)
        .sort(sortObj)
        .skip((page-1)*pageSize) // not efficient way but It's just for the first implementation
        .limit(pageSize)
        .toArray(function(err, timelogs) {
            res.json(timelogs);
            callback();
        });
}
