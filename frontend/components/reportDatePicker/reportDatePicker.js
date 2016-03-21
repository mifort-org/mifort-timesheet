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

angular.module('mifortTimesheet')
    .directive('reportDatePicker', function() {
        return {
            scope: true,
            link: function(scope) {
                scope.$watch('dates', function(newValue, oldValue) {
                    if(newValue && newValue != oldValue){
                        var dateFilter,
                            gridOptions = scope.timesheetGridOptions || scope.grid.options,
                            dateFilterIndex = _.findIndex(gridOptions.reportFilters, function(reportFilter) {
                                return reportFilter.field == 'date';
                            });

                        if(dateFilterIndex < 0){
                            dateFilterIndex = gridOptions.reportFilters.length;
                            dateFilter = {
                                "field": "date"
                            };

                            gridOptions.reportFilters.push(dateFilter);
                        }

                        gridOptions.reportFilters[dateFilterIndex].start = moment(new Date(newValue.startDate)).format('MM/DD/YYYY');
                        gridOptions.reportFilters[dateFilterIndex].end = moment(new Date(newValue.endDate)).format('MM/DD/YYYY');
                    }
                });

                //set default date range
                scope.dates = {
                    startDate: scope.ranges['This month'][0],
                    endDate: scope.ranges['This month'][1]
                };
            },
            templateUrl: 'components/reportDatePicker/reportDatePicker.html'
        };
    });