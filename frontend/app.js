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
    'ui.grid.autoResize',
    'ngBootstrap'
])
    .config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
        $routeProvider.otherwise({redirectTo: '/login'});

        $httpProvider.interceptors.push(function($q, $location) {
            return {
                'responseError': function(rejection){
                    var defer = $q.defer();

                    if(rejection.status == 401){
                        console.dir(rejection);
                        $location.path('login');
                    }

                    defer.reject(rejection);

                    return defer.promise;
                }
            };
        });
    }])

    .controller('myAppController', ['$scope', '$location', '$cookies', '$http', 'preferences', 'companyService', 'topPanelService',
        function($scope, $location, $cookies, $http, preferences, companyService, topPanelService) {
            var user = preferences.get('user');

            if(user){
                $scope.$parent.isLoggedIn = true;

                if(user.companyId){
                    $scope.$parent.companyId = user.companyId;
                }
            }
            else{
                $location.path('login');
            }

            $scope.$watch('companyId', function(newValue, oldValue) {
                if(newValue){

                    companyService.getCompany(newValue).success(function(data) {
                        $scope.companyName = data.name;
                    });
                }
            });

            $scope.isVisible = function(linkName) {
                return topPanelService.isVisibleLink(linkName);
            };

            $scope.logout = function() {
                preferences.remove('user');

                $http.get('logout').then(function() {
                    $location.path('login');
                });
            };

            $scope.openLink = function(linkName) {
                topPanelService.prepForBroadcast(linkName);
            };
        }])

    .factory('topPanelService', ['$location', '$rootScope', function($location, $rootScope) {
        var topPanelService = {};
        topPanelService.linkName = '';

        topPanelService.isVisibleLink = function(linkName) {
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
        };

        topPanelService.prepForBroadcast = function(linkName) {
            topPanelService.linkName = linkName;
            $rootScope.$broadcast('handleBroadcast');
        };

        return topPanelService;
    }]);