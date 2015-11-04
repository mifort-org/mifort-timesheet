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

var utils = require('./libs/utils');
var dbSettings = require('./libs/mongodb_settings');
var log = require('./libs/logger');

//Rest API
exports.restSave = function(req, res, next) {
    var timelogCollection = dbSettings.timelogCollection();
    var batch = timelogCollection.initializeUnorderedBulkOp({useLegacyOps: true});
    
    var ids = [];
    var timelogs = req.body.timelog;

    log.debug('-REST call: Save timelog. Number of timelog items: %d', timelogs.length);

    timelogs.forEach(function(log) {
        if(log._id) {
            batch.find({_id: log._id}).upsert().replaceOne(log);
        } else {
            batch.insert(log);
        }
        ids.push(log._id);
    });

    batch.execute(function(err, result) {
        findAllByIds(ids, function(err, timelogs) {
            returnTimelogArray(err, res, timelogs, next);
            log.debug('-REST Result: Save timelog. Number of saved items: %d', timelogs.length);
        });
    });
};

exports.restDelete = function(req, res, next) {
    var timelogId = utils.getTimelogId(req);
    log.debug('-REST call: Remove timelog. Timelog Id: %s', timelogId.toHexString());

    var timelogCollection = dbSettings.timelogCollection();
    timelogCollection.remove({_id:timelogId}, {single: true},
      function(err, numberOfDeleted){
        if(err) {
            next(err);
        } else {
            res.status(204).json({ok: true});
            log.debug('-REST result: Remove timelog. Timelog is removed. Id: %s', 
                timelogId.toHexString());
        }
    });
};

exports.restGetByDates = function(req, res, next) {
    var start = utils.getStartDate(req);
    var end = utils.getEndDate(req);
    var userId = utils.getUserId(req);
    var projectId = utils.getProjectId(req);

    log.debug('-REST call: Get timelogs by dates. Start date: %s, End date: %s, User Id: %s, Project Id: %s.', 
        start, end, userId.toHexString(), projectId.toHexString());

    var timelogCollection = dbSettings.timelogCollection();
    var query = {
        userId : userId,
        projectId: projectId,
        date : {$gte: start,
                $lte: end}
    };

    timelogCollection.find(query, {sort: 'date'}).toArray(function(err, timelogs){
        returnTimelogArray(err, res, timelogs, next);
        log.debug('-REST result: Get timelogs by dates. User Id: %s, Timelog result size: %d.', 
            userId.toHexString(), timelogs.length);
    });
};

//Private part
function findAllByIds(ids, callback) {
    var timelogCollection = dbSettings.timelogCollection();
    timelogCollection.find({_id:{ $in: ids}}, {'sort': 'date'}).toArray(function(err, timelogs) {
        callback(err, timelogs);
    });
}

function returnTimelogArray(err, res, timelogs, next) {
    if(err) {
        next(err);
        return;
    }
    res.json({timelog: timelogs});
}