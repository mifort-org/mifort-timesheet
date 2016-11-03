/**
 * Created by Asus on 02.11.2016.
 */
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

angular.module('mifortTimesheet.timesheet').factory('projectSummaryService',
    ['$http', function($http) {
        var self = this;


        self.getLoggedTime = function (projectId, logs) {
            if (!projectId) return 0;

            var total = 0;
            var logs = _.filter(logs, {projectId: projectId});
            logs.forEach(function (log) {
                if (log.time) {
                    total += +log.time;
                }
            });
            return total;
        };

        self.getTotalLoggedTime = function (logs) {
            var total = 0;

            logs.forEach(function (log) {
                if (log.time) {
                    total += self.formatTime(log.time);
                }
            });
            return total;
        };

        self.getTotalWorkloadTime = function (projects) {
            if (!projects) return 0;

            return projects.length * self.getWorkload();
        };

        self.getWorkload = function () {
            return 40;
        };

        self.getProjectsWithTime = function (projects, logs) {
            var projectsWithTime = [];

            projects.forEach(function (project) {
                if (project.assignments[0].workload) {
                    projectsWithTime.push({id: project._id, name: project.name});
                }
            });
            logs.forEach(function (log) {
                if (log.time && !_.findWhere(projectsWithTime, {id: log.projectId})) {
                    projectsWithTime.push({id: log.projectId, name: log.projectName});
                }
            });

            return projectsWithTime;
        };

        self.formatTime = function (time){
            if(time && angular.isNumber(time)){
                time = time;
            }
            else if(time && time.slice(-1) == 'h'){
                time = time.slice(0, -1);
            }
            else{
                time = time == "." ? 0 : +time;
            }

            return time;
        }

        return self;
    }
    ]);

