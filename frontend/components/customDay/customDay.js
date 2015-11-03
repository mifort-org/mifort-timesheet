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

angular.module('myApp')
    .directive('customDay', function($timeout) {
        return {
            scope: true,
            link: function(scope, element) {
                scope.editableName = false;
                scope.editableWorkload = false;

                scope.customColors = [
                    {
                        color: '#00ff00',
                        area: ''
                    }
                ];

                scope.$watch('company.dayTypes', function(newValue, oldValue) {
                    var changedDayTypeOldValue,
                        changedDayType,
                        pureNewValues;

                    if(newValue && oldValue && newValue != oldValue){
                        if(oldValue.length == newValue.length){
                            pureNewValues = JSON.parse(angular.toJson(newValue));
                            //changedDayType = _.omit(pureNewValue, function(v,k) { return oldValue[k] === v; });

                            pureNewValues.forEach(function(newDayType, index){
                                if(!_.isEqual(newDayType, oldValue[index])){
                                    changedDayType = newDayType;
                                    changedDayTypeOldValue = oldValue[index]
                                }
                            });
                        }
                        else if(newValue.length > oldValue.length){
                            changedDayType = newValue[newValue.length - 1];
                        }

                        scope.saveDayType(changedDayType, changedDayTypeOldValue);
                    }
                }, true);

                function paintHexagons() {
                    $timeout(function() {
                        //pseudo elements PAINting
                        $(element).find('.hexagon').each(function(index) {
                            var hexagon = $(this),
                                hexagonColor = hexagon.data('color'),
                                selector = '.custom-days-wrapper .hexagon-wrapper .hexagon-' + index;

                            hexagon.addClass('hexagon-' + index);
                            $('head').append("<style>" +
                                selector + ":after{border-top-color: "+ hexagonColor +";}" +
                                selector + ":before{border-bottom-color: "+ hexagonColor +";}" +
                                "</style>");
                        });
                    });
                }
                paintHexagons();

                scope.addCustomDay = function() {
                    scope.company.dayTypes.push({
                        name: 'New Day',
                        workload: 8,
                        color: '#123'
                    });
                    paintHexagons();
                };
            },
            templateUrl: 'components/customDay/customDay.html'
        };
    });