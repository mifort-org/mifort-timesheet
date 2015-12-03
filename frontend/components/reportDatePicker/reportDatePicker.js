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

angular.module('mifortTimelog')
    .directive('reportDatePicker', function () {
        return {
            scope: true,
            link: function (scope) {
                scope.$watch('dates', function(newValue, oldValue) {
                    if(newValue && newValue != oldValue){
                        var dateFilter,
                            dateFilterIndex = _.findIndex(scope.grid.options.reportFilters, function(reportFilter) {
                            return reportFilter.field == 'date';
                        });

                        if(dateFilterIndex < 0){
                            dateFilterIndex = scope.grid.options.reportFilters.length;
                            dateFilter = {
                                "field": "date"
                            };

                            scope.grid.options.reportFilters.push(dateFilter);
                        }

                        scope.grid.options.reportFilters[dateFilterIndex].start = moment(new Date(newValue.startDate)).format('MM/DD/YYYY');
                        scope.grid.options.reportFilters[dateFilterIndex].end = moment(new Date(newValue.endDate)).format('MM/DD/YYYY');
                    }
                })},
            templateUrl: 'components/reportDatePicker/reportDatePicker.html'
        };
    });