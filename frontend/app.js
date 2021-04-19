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

angular.module('constants', [])
    .constant('appVersion', 'devVersion');

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

    'constants',
    'mifortTimesheet.login',
    'mifortTimesheet.company',
    'mifortTimesheet.projects',
    'mifortTimesheet.timesheet',
    'mifortTimesheet.calendar',
    'mifortTimesheet.report',
    'mifortTimesheet.employees',
    'mifortTimesheet.employeesReport'
])
    .config(['$routeProvider', '$httpProvider', '$locationProvider', function($routeProvider, $httpProvider, $locationProvider) {
        $routeProvider
            //.when('/')
            .otherwise({redirectTo: '/login'});
            //.otherwise({redirectTo: '/timesheet'});

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

    .controller('mifortTimesheetController', ['$scope', '$location', '$http', 'preferences', 'companyService', 'topPanelService', '$rootScope', 'notifyingService', 'Notification', 'projectsService', '$window','projectList' ,
        function($scope, $location, $http, preferences, companyService, topPanelService, $rootScope, notifyingService, Notification, projectsService, $window, projectList) {
            var user = preferences.get('user');
            if(user && !user.deleted){
                if(user.companyId){
                    console.log($scope);
                    $rootScope.companyId = user.companyId;
                }

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

            $scope.openFile = function(){
                $('#uploader').click();
            };

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
                document.getElementsByClassName("main-container")[0].scrollTop="0";
            };

            $scope.$on('companyNameChanged', function(response, companyName) {
                $scope.companyName = companyName;
            });

            $rootScope.startIntro = function() {
                $rootScope.introIsActive = true;
                notifyingService.notify('startIntro');
            };

            $scope.changeAccount = function (user) {
              $http.post('api/v1/user/account/' + user._id).success(function(user) {
                preferences.set('user', user);
                $window.location.href = '/';
              });
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
                    Notification.error({message: message +' (' + errorCode + ' error)', delay: null});
                }
            });
        }])
    .directive('fileCsvReader', ['$rootScope', function ($rootScope) {
        return {
            scope: {
                fileReader: "="
            },
            template:   '<input type="file" id="loadCsv" file-reader="fileContent" multiple />',

            link: function (scope, element) {
                $(element).on('change', function (changeEvent) {
                    var files = changeEvent.target.files;
                    if (files.length) {
                        $rootScope.csvInfoUpload = [];
                        var expectedFileExtension = element[0].className.indexOf('txt-icon-images') != -1 ? '.txt' : element[0].className.indexOf('csv-icon-images') != -1 ? '.csv' : '';
                        for (var z = 0; z < files.length; z++) {
                            var fileExtension = files[z].name.match(/\.[0-9a-z]+$/i);
                            if(expectedFileExtension != fileExtension[0]){
                                break
                            }
                            var file = files[z];
                            var r = new FileReader();
                            var counter = 1;
                            r.onload = function (e) {
                                var contents = e.target.result;
                                var lines, data;
                                var userReport = [];
                                lines = contents.split('\n');
                                var currentProject, realTime, comments;

                                for (var i = lines.length; i > 0; i--) {

                                    var line = lines[i];
                                    if (line) {
                                        var allComments = line.replace(/.*,.*,\d?\.?\d*,/g,'');
                                        data = line.split(',');
                                        var taskDate = data[0].replace(/\./g, '/');

                                        currentProject = data[1];
                                        realTime = Number(data[2]);
                                        comments = allComments;

                                        userReport.push({
                                            date: taskDate,
                                            projectName: currentProject,
                                            time: realTime,
                                            comment: comments
                                        });
                                    }

                                }

                                $rootScope.csvInfoUpload = $rootScope.csvInfoUpload.concat(userReport);
                                if (counter == files.length) {
                                    $rootScope.$broadcast('csvInfoLoaded');
                                }
                                counter++;

                            };
                            r.readAsText(file);
                        }
                    }
                });
            }
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
                        linkName == 'print' ||
                        linkName== 'pdf'){
                        return true;
                    }
                    break;
                case '/timesheet':
                    if(linkName == 'timesheet'){
                        return true
                    }
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
    .factory('projectList', ['$rootScope',  function ($rootScope) {
        var currentList = {};
        var setProjectsList = function(list){
            currentList = list;
        };
        var getList = function(){
            return currentList;
        };
        return {
            setProjectsList: setProjectsList,
            getList: getList
        };
    }])
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

                    if(rejection.status == 403){
                        $location.path('timesheet');
                    }

                   $rootScope.$broadcast('handleError', rejection.status);

                    defer.reject(rejection);

                    return defer.promise;
                }
            };
        }
    ]);
