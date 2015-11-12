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

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ngRoute',
    'ngCookies',
    'ui.bootstrap',
    'myApp.login',
    'myApp.company',
    'myApp.projects',
    'myApp.timelog',
    'myApp.timesheet',
    'myApp.report',
    'preferences',
    'angularMoment',
    'angular-click-outside',
    'ui.grid',
    'ui.grid.resizeColumns',
    'ui.grid.autoResize'
])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.otherwise({redirectTo: '/login'});
    }])

    .controller('myAppController', ['$scope', '$location', '$cookies', '$http', 'preferences', 'companyService', 'topPanelService',
        function($scope, $location, $cookies, $http, preferences, companyService, topPanelService) {
            var userPreferences = preferences.get('user');

            if(userPreferences){
                companyService.getCompany(userPreferences.companyId).success(function(data) {
                    $scope.companyName = data.name;
                });

                $scope.isLoggedIn = true;
            }

            $scope.isVisible = function(linkName) {
                return topPanelService.isVisibleLink(linkName);
            };

            $scope.logout = function() {
                preferences.remove('user');

                $http.get('logout').then(function() {
                    $location.path('login');
                });
            }
        }])

    .service('topPanelService', ['$location', function($location) {
        return {
            isVisibleLink: function(linkName) {
                var location = $location.path();

                switch(location){
                    case '/projects':
                        if(linkName == 'project'){
                            return true;
                        }
                        break;
                    case '/report':
                        if(linkName == 'csv' ||
                           linkName == 'print'){
                            return true
                        }
                        break;
                    default:
                        return false
                }
            }
        }
    }]);