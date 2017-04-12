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

angular.module('mifortTimesheet', [
    'ngRoute',
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
    'angular.filter',

    'mifortTimesheet.login',
    'mifortTimesheet.company',
    'mifortTimesheet.projects',
    'mifortTimesheet.timesheet',
    'mifortTimesheet.calendar',
    'mifortTimesheet.report',
    'mifortTimesheet.employees'
])
    .config(['$routeProvider', '$httpProvider', '$locationProvider', function($routeProvider, $httpProvider, $locationProvider) {
        $routeProvider.otherwise({redirectTo: '/login'});

        $httpProvider.interceptors.push('myHttpInterceptor');

        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
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

    .controller('mifortTimesheetController', ['$scope', '$location', '$http', 'preferences', 'companyService', 'topPanelService', '$rootScope', 'notifyingService', 'Notification', 'projectsService',
        function($scope, $location, $http, preferences, companyService, topPanelService, $rootScope, notifyingService, Notification, projectsService) {
            var user = preferences.get('user');
            if(user){
                if(user.companyId){
                    console.log($scope);
                    $rootScope.companyId = user.companyId;
                }

              $http.get('api/v1/user/users?email=' + user.email).success(function(users) {
                console.log(users)
              });

                $rootScope.isLoggedIn = true;
                if (user.role === 'Owner' || user.role === 'Manager') {
                    projectsService.getProjects(user.companyId).success(function(projects) {
                        if (projects.length) {
                            $scope.projects = projects;
                        }
                    });
                }
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

            $scope.openHomePage = function() {
                $location.url($location.path());
                $location.path('/timesheet');
            };

            $scope.logout = function() {
                preferences.clear();

                $http.get('logout').then(function() {
                    $location.path('login');
                });
            };

            $scope.openLink = function(linkName, id) {
                topPanelService.prepForBroadcast(linkName, id);
            };

            $scope.$on('companyNameChanged', function(response, companyName) {
                $scope.companyName = companyName;
            });

            $scope.startIntro = function() {
                $rootScope.introIsActive = true;
                notifyingService.notify('startIntro');
            };

            $scope.$on('handleError', function(event, errorCode) {
                var message;

                switch(errorCode) {
                    case 400:
                        message = 'Not valid data to save';
                        break;
                    case 401:
                        message = '';
                        break;
                    case 403:
                        message = 'You have no permission';
                        break;
                    default:
                        message  = 'Something gone wrong';
                }

                if(message){
                    Notification.error(message +' (' + errorCode + ' error)');
                }
            });
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
                        linkName == 'print' ||
                        linkName== 'pdf'){
                        return true;
                    }
                    break;
                default:
                    return false;
            }
        };

        topPanelService.prepForBroadcast = function(linkName, projectId) {
            topPanelService.linkName = linkName;
            topPanelService.projectId = projectId || undefined;
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
    })

    .factory('myHttpInterceptor', ['$q', '$rootScope', '$injector', '$location',
        function($q, $rootScope, $injector, $location) {
            $rootScope.showSpinner = false;
            $rootScope.http = null;
            return {
                'responseError': function(rejection) {
                    var defer = $q.defer();

                    if(rejection.status == 401){
                        $location.path('login');
                    }

                   $rootScope.$broadcast('handleError', rejection.status);

                    defer.reject(rejection);

                    return defer.promise;
                }
            }
        }
    ]);