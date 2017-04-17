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
    .directive('reportDatePicker', function(preferences, $timeout) {
        return {
            scope: true,
            link: function(scope, element) {
                scope.$watch('dates', function(newValue, oldValue) {
                    if(newValue && newValue != oldValue){
                        var dateFilter,
                            startDate = moment(new Date(newValue.startDate)).format('MM/DD/YYYY'),
                            endDate = moment(new Date(newValue.endDate)).format('MM/DD/YYYY'),
                            gridOptions = scope.timesheetGridOptions || scope.grid.options,
                            workHoursOnDays = 8,
                            dateFilterIndex = _.findIndex(gridOptions.reportFilters, function(reportFilter) {
                                return reportFilter.field == 'date';
                            });

                            scope.getWorkDays = function(startDate, endDate) {
                                var count = 0;
                                var curDate = startDate;
                                while (curDate <= endDate) {
                                    var dayOfWeek = curDate.getDay();
                                    if(!((dayOfWeek == 6) || (dayOfWeek == 0)))
                                        count++;
                                    curDate.setDate(curDate.getDate() + 1);
                                }
                                return count;
                            };
                            var workHours = scope.getWorkDays(new Date(newValue.startDate),new Date(newValue.endDate)) * workHoursOnDays;
                            preferences.set('workHours',workHours);

                            if(dateFilterIndex < 0){
                                    dateFilterIndex = gridOptions.reportFilters.length || 0;
                                    dateFilter = {
                                        "field": "date"
                                    };

                                    gridOptions.reportFilters.push(dateFilter);
                            }

                            gridOptions.reportFilters[dateFilterIndex].start = startDate;
                            gridOptions.reportFilters[dateFilterIndex].end = endDate;
                            element.find('input').val(startDate + ' - ' + endDate);
                            preferences.set('reportFilter', newValue);
                    }
                });

                if(preferences.get('reportFilter')){
                    var savedDate = preferences.get('reportFilter');

                    if(savedDate){
                        $timeout(function() {
                            scope.dates = {
                                startDate: new Date(savedDate.startDate),
                                endDate: new Date(savedDate.endDate)
                            };
                        });
                    }
                }
                else{
                    $timeout(function() {
                        scope.dates = {
                            startDate: scope.ranges['This month'][0],
                            endDate: scope.ranges['This month'][1]
                        };
                    });
                }
            },
            templateUrl: 'components/reportDatePicker/reportDatePicker.html'
        };
    });