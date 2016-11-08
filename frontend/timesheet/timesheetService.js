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
    ['$http', function($http) {
        return {
            getProject: function(projectId) {
                return $http.get('api/v1/project/' + projectId);
            },
            getTimesheet: function(userId, projectId, startDate, endDate) {
                return $http.get('api/v1/timesheet/' + userId + '?projectId=' + projectId + '&startDate=' + startDate + '&endDate=' + endDate);
            },
            removeTimesheet: function(log) {
                return $http.delete('api/v1/timesheet/' + log._id);
            },
            getTimesheetKeys: function() {
                return {
                    'date': '',
                    'project': 'Project',
                    'time': 'Time, h',
                    'comment': 'Comment'
                }
            },
            updateTimesheet: function(userId, timesheet, logsToDelete) {
                return $http.post('api/v1/timesheet', {'timesheet': timesheet, 'logsToDelete': logsToDelete});
            },
            introSteps: [
                {
                    element: '#step1',
                    intro: "<p>Click on arrow will minimize/maximize the section</p>",
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: "<p>Use periods switch arrows (next and previous) to switch the period</p>",
                    position: 'left'
                },
                {
                    element: '#step3',
                    intro: "<p>Table of logs has four columns:" +
                    "<ul class=\"dotted" +
                    "gn\"><li>Date - is not editable but you can add several logs to the current date by pressing the blue plus icon next to Date field." +
                    "New row for log created for current date will have the red minus icon that will delete the log on click</li>" +
                    "<li>Role - dropdown with your roles of this project. If it is only one role it is selected by default." +
                    "There is no possibility to log time with empty role.</li>" +
                    "<li>Time - numeric input where you log." +
                    "Empty input shows placeholder with minimum of your workload (personal workload how much time this person works per day) and project assignment workload.</li>" +
                    "<li>Comment - input where you write detailed description of tasks which you done at logged time.</li></ul>" +
                    "<p>Each day will may have a background color and workload according to Timesheet Calendar option created by Owner/HR/Manager.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step4',
                    intro: "<p>Use ctrl+down or ctrl+up shortcuts when field on focus to duplicate commet for next or previous log.</p>",
                    position: 'bottom'
                }
            ]
    }
}
]);

