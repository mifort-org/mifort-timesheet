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
    .directive('dropdownFilter', function() {
        return {
            scope: true,
            link: function(scope, element, attrs) {
                scope.popoverOpened = false;

                scope.getProjectFilter = function () {
                    return _.find(scope.grid.options.reportFilters, function(filter) {
                        if(filter.field == attrs.colName){
                            filter.value = filter.value.map(function(filterValue) {
                                if(filterValue.name){
                                    return filterValue;
                                }
                                else{
                                    return {
                                        name: filterValue,
                                        isChecked: false
                                    }
                                }
                            });

                            return true;
                        }
                    })
                };

                scope.dynamicPopover = {
                    content: attrs.colTitle,
                    templateUrl: 'myPopoverTemplate.html',
                    projectFilter: scope.getProjectFilter()
                };

                scope.$watch("grid.options.reportFilters", function (newValue, oldValue) {
                    scope.dynamicPopover.projectFilter = scope.getProjectFilter();
                });

                scope.hasFilter = function() {
                    if(scope.dynamicPopover.projectFilter){
                        return _.where(scope.dynamicPopover.projectFilter.value, {isChecked: true}).length;
                    }
                };

                scope.range = function(n) {
                    return new Array(n);
                };
            },
            templateUrl: 'components/dropdownFilter/dropdownFilter.html'
        };
    });