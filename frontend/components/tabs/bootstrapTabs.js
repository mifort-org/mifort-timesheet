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
    .directive('bootstrapTabs', function($location, preferences) {
        return {
            scope: true,
            link: function (scope, element, attributes) {
                var currentLocation  = $location.path().substr(1),
                    userRole = preferences.get('user').role.toLowerCase();

                scope.tabs = [
                    {
                        title: scope.companyName,
                        url: 'company',
                        active: false,
                        available: userRole == 'owner'
                    },
                    {
                        title: 'Projects',
                        url: 'projects',
                        active: false,
                        available: userRole == 'owner' || userRole == 'manager'
                    },
                    {
                        title: 'Calendar',
                        url: 'calendar',
                        active: false,
                        available: userRole == 'owner' || userRole == 'manager'
                    },
                    {
                        title: 'Report',
                        url: 'report',
                        active: false,
                        available: userRole == 'owner' || userRole == 'manager'
                    },
                    {
                        title: 'Timelog',
                        url: 'timelog',
                        active: false,
                        available: true
                    }
                    //{
                    //    title: 'Company create',
                    //    url: 'company-create',
                    //    active: false,
                    //    available: false
                    //}
                ];

                changeActiveTab(currentLocation);

                attributes.$observe('companyName', function(value){
                    if(value){
                        scope.tabs[0].title = value;
                    }
                });

                scope.changeTab = function (tab) {
                    $location.path('/' + tab.url);
                };

                scope.$on('$locationChangeStart', function(){
                    changeActiveTab($location.path().substr(1))
                });

                function changeActiveTab(newLocation){
                    scope.tabs.map(function(tab) {
                        if(tab.url == newLocation){
                            tab.active = true;
                        }
                    });
                }
            },
            templateUrl: 'components/tabs/bootstrapTabs.html'
        };
    });