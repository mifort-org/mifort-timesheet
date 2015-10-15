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
                scope.customDays = [
                    {
                        name: 'Weekend',
                        workload: 8,
                        color: '#c5e9fb'
                    },
                    {
                        name: 'Corporate',
                        workload: 4,
                        color: '#f3cce1'
                    },
                    {
                        name: 'Holiday',
                        workload: 12,
                        color: '#fff9a1'
                    },
                    {
                        name: 'OOO',
                        workload: 3,
                        color: '#d9d9d9'
                    }
                ];

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
            },
            templateUrl: 'components/customDay/customDay.html'
        };
    });