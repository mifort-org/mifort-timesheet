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
var dbSettings = require('./libs/mongodb_settings');
var log = require('./libs/logger');
var utils = require('./libs/utils');

var projects = require('./project');

//Rest API
exports.restCommonReport = function(req, res, next) {
    var filterObj = req.body;
    log.debug('-REST call: common report. Company id: %s', filterObj.companyId.toHexString());

    var timelogCollection = dbSettings.timelogCollection();
    projects.findProjectIdsByCompanyId(filterObj.companyId, function(err, projectIds) {
        if(err) {
            next(err);
            return;
        }
        var projectIdArray = projectIds.map(function(object) {
            return object._id;
        });
        var query = convertFiltersToQuery(filterObj.filters);
        var sortObj = {};
        sortObj[filterObj.sort.field] = (filterObj.sort.asc ? 1 : -1);

        timelogCollection.find(query)
            .sort(sortObj)
            .skip((filterObj.page-1)*filterObj.pageSize) // not efficient way but It's just for the first implementation
            .limit(filterObj.pageSize)
            .toArray(function(err, timelogs) {
                res.json(timelogs);
                log.debug('-REST result: common report. Company id: %s', 
                    filterObj.companyId.toHexString());
            });
    });
};

exports.restGetFilterValues = function(req, res, next) {
    var companyId = utils.getCompanyId(req);
    log.debug('-REST call: Get filter values. Company id: %s', companyId.toHexString());

    var timelogCollection = dbSettings.timelogCollection();
    var filterValues = {};

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
                filterValues.userNames = userNames;
                
                timelogCollection.distinct('projectName', {projectId : {$in: projectIdArray}},
                    function(err, projectNames){
                        if(err) {
                            next(err);
                            return;
                        }
                        filterValues.projectNames = projectNames;

                        timelogCollection.distinct('role', {projectId : {$in: projectIdArray}},
                            function(err, roles){
                                if(err) {
                                    next(err);
                                    return;
                                }
                                filterValues.roles = roles;
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

    return query;
}