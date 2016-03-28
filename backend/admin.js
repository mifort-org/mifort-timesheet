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
var utils = require('./libs/utils');
var log = require('./libs/logger');

exports.restDownloadLog = function(req, res, next) {
    var fileName = utils.getFileName(req);
    log.debug('-REST Call: Download logs. File name %s', fileName);

    res.download('./' + fileName, fileName, function(err) {
        if(err) {
            next(err);
            return;
        } else {
            log.debug('-REST Result: Download logs. File is downloaded. %s', fileName);
        }
    })
};

exports.restBuildInfo = function(req, res, next) {
    log.debug('-REST Call: Get build info');
    res.json({
        Build_number: process.env.HEROKU_RELEASE_VERSION,
        Build_time: process.env.HEROKU_RELEASE_CREATED_AT,
        Build_revision: process.env.HEROKU_SLUG_DESCRIPTION
    });
    log.debug('-REST Call: Get build info');
};
