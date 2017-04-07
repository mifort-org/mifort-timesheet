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

angular.module('mifortTimesheet.employeesReport').factory('employeesReportService',
    ['$http', function ($http) {
        var self = this,
            saveFilters = [];

        self.getSavedFilters = function () {
            return  saveFilters
        };

        self.saveSavedFilters = function (filters) {
            saveFilters  = filters;
        };

        self.getFilters = function (companyId) {
            return $http.get('api/v1/report/filters/' + companyId);
        };
        self.getReport = function (reportSettings) {
            if (reportSettings.groupBy && reportSettings.groupBy.length) {
                return $http.post('api/v1/report/aggregation', reportSettings);
            }
            else {
                return $http.post('api/v1/report/common', reportSettings);
            }
        };
        self.downloadCsv = function (reportSettings) {
            return $http.post('api/v1/report/common/download/csv', reportSettings);
        };
        self.downloadAggregationCsv = function (reportSettings) {
            return $http.post('api/v1/report/aggregation/download/csv', reportSettings);
        };
        self.downloadPdf = function (reportSettings) {
            return $http.post('api/v1/report/common/download/pdf', reportSettings);
        };
        self.downloadAggregationPdf = function (reportSettings) {
            return $http.post('api/v1/report/aggregation/download/pdf', reportSettings);
        };
        self.getHeaderTemplate = function (filterHeaderTemplate) {
            return '<div class="header-area" ng-class="{ \'sortable\': sortable }">' +
                '<div class="ui-grid-vertical-bar">&nbsp;</div>' +
                '<div class="ui-grid-cell-contents" col-index="renderIndex">' +
                '<span>{{ col.displayName CUSTOM_FILTERS }}</span>' +
                '<span ui-grid-visible="col.sort.direction" class="header-sort-direction" ng-class="{ \'ui-grid-icon-up-dir\': col.sort.direction == asc, \'ui-grid-icon-down-dir\': col.sort.direction == desc, \'ui-grid-icon-blank\': !col.sort.direction }">' +
                '&nbsp;' +
                '</span>' +
                '</div>' +
                '<div class="ui-grid-column-menu-button" ng-if="grid.options.enableColumnMenus && !col.isRowHeader  && col.colDef.enableColumnMenu !== false" class="ui-grid-column-menu-button" ng-click="toggleMenu($event)">' +
                '<i class="ui-grid-icon-angle-down">&nbsp;</i>' +
                '</div>' +
                '<div ng-if="filterable" class="ui-grid-filter-container" ng-repeat="colFilter in col.filters">' +
                '<div class="ui-grid-filter-button" ng-click="colFilter.term = null">' +
                '<i class="ui-grid-icon-cancel" ng-show="!!colFilter.term">&nbsp;</i>' + <!-- use !! because angular interprets 'f' as false -->
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="header-area">' + filterHeaderTemplate + '</div>';
        };
        self.columns = {
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
                minWidth: 190,
                width: 190,
                headerCellClass: 'name-header',
                enableColumnResizing: true,
                enableColumnMenu: false,
                filterHeaderTemplate: '<div ng-if="$parent.grid.appScope.userIsManager" class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="users" col-title="Employee Name"></span></div>',
                cellTemplate: '<div class="ui-grid-cell-contents">' +
                '<a href="" ng-if="$parent.grid.appScope.userIsManager" ng-click="$parent.grid.appScope.editEmployeeTimesheet(row.entity.userName)">{{row.entity.userName}}</a>' +
                '<span ng-if="!$parent.grid.appScope.userIsManager">{{row.entity.userName}}</span>' +
                '</div>',
                headerCellTemplate: self.getHeaderTemplate('<span ng-if="$parent.grid.appScope.userIsManager" class="header-filter ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="users" col-title="Employee Name"></span></span>')
            },
            projectName: {
                field: 'projectName',
                minWidth: 169,
                width: 169,
                headerCellClass: 'name-header',
                enableColumnResizing: true,
                enableColumnMenu: false,
                headerCellTemplate: self.getHeaderTemplate('<span class="header-filter ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="projects" col-title="Project Name"></span></span>')
            },
            time: {
                field: 'time',
                width: 82,
                minWidth: 82,
                headerCellClass: 'time-header',
                paddingRight: 0,
                enableColumnResizing: true,
                enableColumnMenu: false,
                enableFiltering: false,
                filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Time"></span></div>',
                cellTemplate: '<div class="report-time-cell">{{row.entity[col.field]}}</div>'
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

        };
        self.employeeColuns = {
            actualTime: {
                field: 'actualTime',
                width: 200,
                minWidth: 200,
                headerCellClass: 'time-header',
                paddingRight: 0,
                enableColumnResizing: true,
                enableColumnMenu: false,
                enableFiltering: false,
                filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="actualTime" col-title="ActualTime"></span></div>',
                cellTemplate: '<div class="report-time-cell">{{row.entity[col.field]}}</div>'
            },

            expectedTime: {
                field: 'expectedTime',
                width: 200,
                minWidth: 200,
                headerCellClass: 'time-header',
                paddingRight: 0,
                enableColumnResizing: true,
                enableColumnMenu: false,
                enableFiltering: false,
                filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="expectedTime" col-title="expectedTime"></span></div>',
                cellTemplate: '<div class="report-time-cell">{{row.entity[col.field]}}</div>'
            },
            status: {
                field: 'status',
                width: 200,
                minWidth: 200,
                headerCellClass: 'time-header',
                paddingRight: 0,
                enableColumnResizing: true,
                enableColumnMenu: false,
                enableFiltering: false,
                filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="status" col-title="status"></span></div>',
                cellTemplate: '<div class="report-time-cell">{{row.entity[col.field]}}</div>'
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

        };
        self.introSteps = [
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
        ];
        return self;
    }
    ]);