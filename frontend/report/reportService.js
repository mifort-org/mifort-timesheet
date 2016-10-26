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

angular.module('mifortTimesheet.report').factory('reportService',
    ['$http', function($http) {
        return {
            getFilters: function(companyId) {
                return $http.get('api/v1/report/filters/' + companyId);
            },
            getReport: function(reportSettings) {
                if(reportSettings.groupBy && reportSettings.groupBy.length){
                    return $http.post('api/v1/report/aggregation', reportSettings);
                }
                else{
                    return $http.post('api/v1/report/common', reportSettings);
                }
            },
            downloadCsv: function(reportSettings) {
                return $http.post('api/v1/report/common/download', reportSettings);
            },
            downloadAggregationCsv: function(reportSettings) {
                return $http.post('api/v1/report/aggregation/download', reportSettings);
            },
            columns: {
                date: {
                    field: 'date',
                    minWidth: 168,
                    width: 168,
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    enableFiltering: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span report-date-picker id="step2" class="report-filter"></span></div>'
                },
                userName: {
                    field: 'userName',
                    displayName: 'Employee Name',
                    minWidth: 172,
                    width: 172,
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div ng-if="$parent.grid.appScope.userIsManager" class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="users" col-title="Employee Name"></span></div>',
                    cellTemplate: '<div class="ui-grid-cell-contents">' +
                    '<a href="" ng-if="$parent.grid.appScope.userIsManager" ng-click="$parent.grid.appScope.editEmployeeTimesheet(row.entity.userName)">{{row.entity.userName}}</a>' +
                    '<span ng-if="!$parent.grid.appScope.userIsManager">{{row.entity.userName}}</span>' +
                    '</div>'
                },
                projectName: {
                    field: 'projectName',
                    minWidth: 152,
                    width: 152,
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="projects" col-title="Project Name"></span></div>'
                },
                time: {
                    field: 'time',
                    width: 82,
                    paddingRight:0,
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    enableFiltering: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Time"></span></div>',
                    cellTemplate:'<div class="report-time-cell">{{row.entity[col.field]}}</div>'
                },
                comment: {
                    field: 'comment',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    enableSorting: false,
                    enableFiltering: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Comment"></span></div>',
                    cellTemplate: '<span cutted-comment></span>'
                },
                comments: {
                    field: 'comments',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    enableSorting: false,
                    enableFiltering: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Comments"></span></div>',
                    cellTemplate: '<span cutted-comment></span>'
                }
            },
            introSteps: [
                {
                    element: '#step1',
                    intro: "<p>This is a table of all logs among the application. Each column could be sorted by clicking on column name " +
                    "and each of them has filter that could be opened on the filter button next to column name.</p>" +
                    "<p>User, Project and Assignment columns has dropdown filter with the quick search field and checkboxes to choose the filtered options.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: "<p>Switch tabs to change the column to be aggregated.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step3',
                    intro: "<p>Use aggregation field to set the period of time to show.</p>",
                    position: 'bottom'
                },
                {
                    element: '#print',
                    intro: "<p>You could print or export the report by pressing the top panel buttons Print/CSV.</p>",
                    position: 'left'
                }
            ]
        }
    }
    ]);