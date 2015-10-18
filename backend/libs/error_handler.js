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

var log = require('./logger');

module.exports = function(err, req, res, next) {
    var message = 'Oopps... We are working on your problem.';
    if(err.message) {
        message = err.message;
    }
    log.error(message + '; Stack: ' + err.stack, {error: err});
    var code = 500;
    if(err.code) {
        code = err.code;
    }

    res.status(code).json({error: message});
};