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
    .directive('customDay', function() {
        return {
            scope: true,
            link: function(scope, element) {
                scope.customColors = [
                    {
                        color: '#99ff99',
                        area: '27, 12, 30, 18, 39, 18, 43, 12, 39, 5, 31, 5'
                    },
                    {
                        color: '#99ffcc',
                        area: '43, 12, 39, 18, 44, 26, 53, 25, 56, 19, 51, 11'
                    },
                    {
                        color: '#66ffff',
                        area: '56, 18, 53, 25, 57, 32, 67, 32, 66, 21, 62, 17'
                    },
                    {
                        color: '#66ccff',
                        area: '67, 33, 57, 33, 53, 39, 56, 47, 67, 47'
                    },
                    {
                        color: '#99ccff',
                        area: '66, 47, 57, 46, 52, 52, 56, 60, 61, 62, 67, 57'
                    },
                    {
                        color: '#cc99ff',
                        area: '52, 53, 56, 60, 51, 67, 43, 67, 40, 60, 44, 53'
                    },
                    {
                        color: '#ff99ff',
                        area: '39, 59, 44, 67, 40, 73, 30, 73, 26, 67, 30, 59'
                    },
                    {
                        color: '#ff99cc',
                        area: '26, 67, 17, 66, 12, 60, 17, 54, 25, 53, 30, 60'
                    },
                    {
                        color: '#ff9999',
                        area: '4, 46, 13, 46, 17, 53, 13, 60, 6, 60, 1, 58'
                    },
                    {
                        color: '#ffcc99',
                        area: '3, 46, 13, 46, 17, 39, 12, 33, 4, 33, 2, 38'
                    },
                    {
                        color: '#ffff99',
                        area: '12, 33, 17, 26, 12, 19, 5, 18, 2, 20, 3, 32'
                    },
                    {
                        color: '#ccff99',
                        area: '26, 25, 29, 19, 26, 12, 18, 12, 13, 18, 17, 26'
                    },
                    {
                        color: '#ccffcc',
                        area: '40, 33, 43, 26, 39, 18, 31, 18, 26, 25, 30, 33'
                    },
                    {
                        color: '#ccffff',
                        area: '52, 26, 57, 32, 52, 40, 44, 39, 39, 33, 43, 25'
                    },
                    {
                        color: '#ccccff',
                        area: '53, 53, 57, 47, 53, 40, 43, 39, 40, 45, 42, 53'
                    },
                    {
                        color: '#ffccff',
                        area: '40, 46, 43, 53, 40, 60, 30, 60, 26, 54, 30, 46'
                    },
                    {
                        color: '#ffcccc',
                        area: '26, 39, 30, 46, 26, 53, 17, 53, 13, 46, 16, 39'
                    },
                    {
                        color: '#ffffcc',
                        area: '16, 26, 25, 25, 30, 33, 25, 39, 17, 39, 13, 32'
                    },
                    {
                        color: '#ffffff',
                        area: '30, 33, 39, 33, 44, 40, 39, 46, 29, 46, 26, 39'
                    }
                ];

                scope.$watch('company.dayTypes', function(newValue, oldValue) {
                   if(newValue && oldValue && newValue != oldValue){
                        scope.saveDayType();
                    }

                }, true);

                scope.chooseColor = function(colorIndex, day) {
                    var chosenColor = scope.customColors[colorIndex].color;

                    day.pickerVisible = false;
                    day.color = chosenColor;
                    paintHexagons();
                };

                scope.showColorPicker = function(dayIndex) {
                    scope.company.dayTypes[dayIndex].pickerVisible = true;
                };
                function paintHexagons() {
                    $(element).find('.hexagon').each(function(index) {
                        var hexagon = $(this),
                            hexagonColor = scope.company.dayTypes[$(this).index()].color,
                            selector = '.custom-days-wrapper .hexagon-wrapper .hexagon-' + index;
                        hexagon.addClass('hexagon-' + index);
                        $('head').append("<style>" +
                            selector + ":after{border-top-color: " + hexagonColor + ";}" +
                            selector + ":before{border-bottom-color: " + hexagonColor + ";}" +
                            "</style>");
                    });
                }

                addHexagonsListener();

                function addHexagonsListener(){
                    $('.hexagon-wrapper').bind('DOMSubtreeModified', function(e) {
                        if (e.target.innerHTML.length > 0) {
                            paintHexagons();
                        }
                    });
                }

                scope.addCustomDay = function() {
                    scope.company.dayTypes.push({
                        name: 'New Day',
                        time: 8,
                        color: '#fff'
                    });

                    addHexagonsListener();
                    paintHexagons();
                };
            },
            templateUrl: 'components/customDay/customDay.html'

        };
    });