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

angular.module('mifortTimelog', [
    'ngRoute',
    'ngCookies',
    'ui.bootstrap',
    'preferences',
    'angularMoment',
    'angular-click-outside',
    'ui.grid',
    'ui.grid.resizeColumns',
    'ui.grid.autoResize',
    'ui.select',
    'ngSanitize',
    'ngBootstrap',
    'ui-notification',
    'angular-intro',
    'mifortTimelog.login',
    'mifortTimelog.company',
    'mifortTimelog.projects',
    'mifortTimelog.timelog',
    'mifortTimelog.timesheet',
    'mifortTimelog.report'
])
    .config(['$routeProvider', '$httpProvider', '$locationProvider', function($routeProvider, $httpProvider, $locationProvider) {
        $routeProvider.otherwise({redirectTo: '/login'});

        $httpProvider.interceptors.push(function($q, $location) {
            return {
                'responseError': function(rejection) {
                    var defer = $q.defer();

                    if(rejection.status == 401){
                        $location.path('login');
                    }

                    defer.reject(rejection);

                    return defer.promise;
                }
            };
        });

        //$locationProvider.html5Mode(true);
    }])

    .config(function(NotificationProvider) {
        NotificationProvider.setOptions({
            delay: 1000,
            startTop: 20,
            startRight: 40,
            verticalSpacing: 20,
            horizontalSpacing: 20,
            positionX: 'right',
            positionY: 'bottom'
        });
    })

    .controller('mifortTimelogController', ['$scope', '$location', '$cookies', '$http', 'preferences', 'companyService', 'topPanelService', '$rootScope', 'notifyingService',
        function($scope, $location, $cookies, $http, preferences, companyService, topPanelService, $rootScope, notifyingService) {
            var user = preferences.get('user');

            if(user){
                if(user.companyId){
                    $rootScope.companyId = user.companyId;
                }

                $rootScope.isLoggedIn = true;
            }
            else{
                $location.path('login');
            }

            $scope.$watch('companyId', function(newValue) {
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

            $scope.$on('companyNameChanged', function(response, companyName) {
                $scope.companyName = companyName;
            });

            $scope.startIntro = function() {
                notifyingService.notify('startIntro');
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
            $rootScope.$broadcast('handleBroadcast'); //use notifyingService instead
        };

        return topPanelService;
    }])

    .factory('notifyingService', function($rootScope) {
        return {
            subscribe: function(message, callback, scope) {
                var handler = $rootScope.$on(message, callback);
                scope.$on('$destroy', handler);
            },

            notify: function(message) {
                $rootScope.$emit(message);
            }
        };
    });