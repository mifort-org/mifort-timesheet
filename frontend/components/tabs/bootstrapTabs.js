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
    .directive('bootstrapTabs', function($location, $route, preferences, appVersion, $window, $document, $timeout) {
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
                        available: userRole === 'owner',
                        id: "company-name-tab"
                    },
                    {
                        title: 'Projects',
                        url: 'projects',
                        active: false,
                        available: userRole === 'owner' || userRole === 'manager'
                    },
                    {
                        title: 'Employees',
                        url: 'employees',
                        active: false,
                        available: userRole === 'owner' || userRole === 'manager'
                    },
                    /*{
                        title: 'Employees Report',
                        url: 'employees-report',
                        active: false,
                        available: userRole === 'owner' || userRole === 'manager'
                    },*/
                    {
                        title: 'Calendar',
                        url: 'calendar',
                        active: false,
                        available: userRole === 'owner' || userRole === 'manager'
                    },
                    {
                        title: 'Report',
                        url: 'report',
                        active: false,
                        available: true
                    },
                    {
                        title: 'Timesheet',
                        url: 'timesheet',
                        active: false,
                        available: true
                    }
                ];

                changeActiveTab(currentLocation);

                attributes.$observe('companyName', function(value){
                    if(value){
                        scope.tabs[0].title = value;
                    }
                });

                scope.changeTab = function (tab) {
                    $location.url($location.path());
                    $location.path('/' + tab.url);
                };

                scope.$on('$locationChangeStart', function(){
                    changeActiveTab($location.path().substr(1))
                });

                scope.isTimesheetTabActive = function () {
                    return $route.current.$$route.controller == "timesheetController";
                };

                function changeActiveTab(newLocation){
                    scope.tabs.map(function(tab) {
                        if(tab.url == newLocation){
                            tab.active = true;
                        }
                    });
                }

                var controlsHeight;
                var tabsHeight;
                $timeout(function() {
                    controlsHeight = $document.find('.main-controls')[0].offsetHeight;
                    tabsHeight = $document.find('.main-tabset')[0].offsetHeight;
                });

                angular.element($window).bind("scroll", function() {
                    if (this.pageYOffset >= (controlsHeight + tabsHeight)) {
                        element.addClass('fixed-projects');
                    } else {
                        element.removeClass('fixed-projects');
                    }
                });
            },
            templateUrl: function (element) {
                var activeTemplate;

                if(element.is('span')){
                    activeTemplate = 'components/tabs/burgerMenu.html?res=' + appVersion;
                }
                else{
                    activeTemplate = 'components/tabs/bootstrapTabs.html?res=' + appVersion;
                }

                return activeTemplate
            }
        };
    })
    .controller('CollapseDemoCtrl', function ($scope) {
    $scope.isNavCollapsed = true;
    $scope.isCollapsed = false;
    $scope.isCollapsedHorizontal = false;
});
