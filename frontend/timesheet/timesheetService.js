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

'use strict';

angular.module('mifortTimesheet.timesheet').factory('timesheetService',
    ['$http', function ($http) {
        return {
            getProject: function (projectId) {
                return $http.get('project/' + projectId);
            },
            getTimesheet: function (userId, projectId, startDate, endDate) {
                return $http.get('timelog/' + userId + '?projectId=' + projectId + '&startDate=' + startDate+ '&endDate=' + endDate);
            },
            removeTimesheet: function (log) {
                return $http.delete('timelog/' + log._id);
            },
            getTimesheetKeys: function () {
                return {
                    'date': 'Date',
                    'role': 'Role',
                    'time': 'Time',
                    'comment': 'Comment'
                }
            },
            updateTimesheet: function (userId, timetog) {
                return $http.post('timelog', {'timelog': timetog});
            }
        }
    }
    ]);
