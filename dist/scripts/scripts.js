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

    .config(['NotificationProvider', function(NotificationProvider) {
        NotificationProvider.setOptions({
            delay: 1000,
            startTop: 20,
            startRight: 40,
            verticalSpacing: 20,
            horizontalSpacing: 20,
            positionX: 'right',
            positionY: 'bottom'
        });
    }])

    .controller('mifortTimesheetController', ['$scope', '$location', '$http', 'preferences', 'companyService', 'topPanelService', '$rootScope', 'notifyingService', 'Notification',
        function($scope, $location, $http, preferences, companyService, topPanelService, $rootScope, notifyingService, Notification) {
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
                preferences.clear();

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

    .factory('notifyingService', ['$rootScope', function($rootScope) {
        return {
            subscribe: function(message, callback, scope) {
                var handler = $rootScope.$on(message, callback);
                scope.$on('$destroy', handler);
            },

            notify: function(message) {
                $rootScope.$emit(message);
            }
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

                   $rootScope.$broadcast('handleError', rejection.status);

                    defer.reject(rejection);

                    return defer.promise;
                }
            }
        }
    ]);
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
    .directive('bootstrapTabs', ['$location', 'preferences', function($location, preferences) {
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
                        title: 'Employees',
                        url: 'employees',
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
                    var activeTab = _.findWhere(scope.tabs, {active: true});
                    return activeTab && activeTab.title == "Timesheet";
                };

                function changeActiveTab(newLocation){
                    scope.tabs.map(function(tab) {
                        if(tab.url == newLocation){
                            tab.active = true;
                        }
                    });
                }
            },
            templateUrl: function (element) {
                var activeTemplate;

                if(element.is('span')){
                    activeTemplate = 'components/tabs/burgerMenu.html';
                }
                else{
                    activeTemplate = 'components/tabs/bootstrapTabs.html';
                }

                return activeTemplate
            }
        };
    }]);
'use strict';

angular.module('mifortTimesheet')
    .directive('projectSummary', ['$location', 'preferences', 'projectSummaryService', function($location, preferences, projectSummaryService) {
        return {
            scope: true,
            link: function (scope, element, attrs) {

                scope.getLoggedTime = function (projectId) {
                    return projectSummaryService.getLoggedTime(projectId, scope.getCurrentLogDates());
                };

                scope.getTotalLoggedTime = function () {
                    return projectSummaryService.getTotalLoggedTime(scope.getCurrentLogDates());
                };

                function initWatchers() {

                    scope.$watch("logs", function (newValue, oldValue) {
                        scope.projectsWithTime = projectSummaryService.getProjectsWithTime(scope.projects, scope.getCurrentLogDates());
                    }, true);
                }

                scope.getTotalWorkloadTime = function () {
                    return projectSummaryService.getTotalWorkloadTime(scope.projectsWithTime);
                };

                scope.getWorkload = function () {
                    return projectSummaryService.getWorkload();
                };

                scope.getCurrentLog = function () {
                    return _.findWhere(scope.logs, {index: scope.currentPeriodIndex});
                };

                scope.getCurrentLogDates = function () {
                    var log = scope.getCurrentLog();
                    return log ? log.data : [];
                };

                var handler = scope.$root.$on('projectsAndLogsLoaded', function (event, data) {
                    initWatchers();

                    scope.projects = data.projects;
                    scope.logs = data.logs;
                    scope.currentPeriodIndex = data.index;
                    scope.projectsWithTime = [];

                });

                scope.$on('$destroy', handler);
            },
            templateUrl: function () {
                return 'components/projectSummary/projectSummary.html'
            }
        }
    }]);

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
    .directive('tableCell', function () {
        return {
            scope: true,
            link: function (scope, element) {
                var clickableAreaWidth = 7;

                //element.on('click', function (e) {
                //    if(scope.day.date && ($(e.target).hasClass('start-splitter') || $(e.target).hasClass('end-splitter'))){
                //        var dayIndex = _.findIndex(scope.calendar, scope.day);
                //        var nextDay = scope.calendar[dayIndex + 1],
                //            previousDay = scope.calendar[dayIndex - 1];
                //
                //        //left border click
                //        if (e.pageX - clickableAreaWidth < $(this).offset().left) {
                //            scope.day.isPeriodStartDate = !scope.day.isPeriodStartDate;
                //            if(previousDay && previousDay.date){
                //                previousDay.isPeriodEndDate = !previousDay.isPeriodEndDate;
                //                scope.aggregatePeriods(scope.calendar);
                //            }
                //        }
                //        //right border click
                //        else if (e.pageX > $(this).offset().left + $(this).outerWidth() - clickableAreaWidth) {
                //            scope.day.isPeriodEndDate = !scope.day.isPeriodEndDate;
                //            if(nextDay && nextDay.date) {
                //                nextDay.isPeriodStartDate = !nextDay.isPeriodStartDate;
                //                scope.aggregatePeriods(scope.calendar);
                //            }
                //        }
                //
                //        scope.$apply();
                //    }
                //});

                scope.getDayTime = function(day) {
                    if(day.dayId){
                        var currentDayDayType = _.findWhere(scope.company.dayTypes, {id: day.dayId});

                        if(currentDayDayType){
                            return currentDayDayType.time;
                        }
                    }
                    else{
                        return day.time;
                    }
                };

                scope.isToday = function(day) {
                    return moment(new Date(day.date)).isSame(new Date(), 'day');
                };
            },
            templateUrl: 'components/tableCell/tableCell.html'
        };
    });
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
    .directive('projectRow', function() {
        return {
            scope: true,
            link: function(scope) {

            },
            templateUrl: 'components/projectRow/projectRow.html'
        };
    });
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

angular.module('preferences', []);
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

angular.module('preferences').factory('preferences', ['$q', '$location', function ($q, $location) {

    return {
        set: function (key, value) {
            localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
        },

        get: function (key) {
            var data = localStorage.getItem(key);

            if (data && typeof data === 'string' && (data[0] === '[' || data[0] === '{')) {
                data = JSON.parse(data, function(k, v) {
                    return (typeof v === "object" || isNaN(v)) ? v : parseInt(v, 10);
                });
            }

            if(key === 'user' && !data){
                $location.path('login');
            }

            return data === 'true' || (data === 'false' ? false : data);
        },

        remove: function (key) {
            localStorage.removeItem(key);
        },

        clear: function() {
            localStorage.clear();
        }
    };
}]);

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
                    paintHexagons()
                };
            },
            templateUrl: 'components/customDay/customDay.html'
        };
    });
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


angular.module('mifortTimesheet').filter('propsFilter', function() {
    return function(items, props) {
        var out = [];

        if(angular.isArray(items)){
            items.forEach(function(item) {
                var itemMatches = false;

                var keys = Object.keys(props);
                for(var i = 0; i < keys.length; i++){
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if(item[prop].toString().toLowerCase().indexOf(text) !== -1){
                        itemMatches = true;
                        break;
                    }
                }

                if(itemMatches){
                    out.push(item);
                }
            });
        }else{
            out = items;
        }

        return out;
    }
});

angular.module('mifortTimesheet')
    .filter("toDateFilter", function () {
        return function (input) {
            return new Date(input);
        }
    });

angular.module('mifortTimesheet')
    .filter('longTextFilter', function(){

    return function(s, limit){
        var dots = "...";
        if(s.length > limit)
        {
            // you can also use substr instead of substring
            s = s.substring(0,limit) + dots;
        }

        return s;
    };
});

angular.module('mifortTimesheet')
    .filter('fixedFilter', function(){

    return function(n){
        if (n.toFixed() != n) {
            return n.toFixed(2);
        }
        return n;
    };
});

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
    .directive('dropdownFilter', function() {
        return {
            scope: true,
            link: function(scope, element, attrs) {
                scope.popoverOpened = false;

                scope.getProjectFilter = function () {
                    return _.find(scope.grid.options.reportFilters, function(filter) {
                        if(filter.field == attrs.colName){
                            filter.value = filter.value.map(function(filterValue) {
                                if(filterValue.name){
                                    return filterValue;
                                }
                                else{
                                    return {
                                        name: filterValue,
                                        isChecked: false
                                    }
                                }
                            });

                            return true;
                        }
                    })
                };

                scope.dynamicPopover = {
                    content: attrs.colTitle,
                    templateUrl: 'myPopoverTemplate.html',
                    projectFilter: scope.getProjectFilter()
                };

                scope.$watch("grid.options.reportFilters", function (newValue, oldValue) {
                    scope.dynamicPopover.projectFilter = scope.getProjectFilter();
                });

                scope.hasFilter = function() {
                    if(scope.dynamicPopover.projectFilter){
                        return _.where(scope.dynamicPopover.projectFilter.value, {isChecked: true}).length;
                    }
                };

                scope.range = function(n) {
                    return new Array(n);
                };
            },
            templateUrl: 'components/dropdownFilter/dropdownFilter.html'
        };
    });
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
    .directive('reportDatePicker', ['preferences', '$timeout', function(preferences, $timeout) {
        return {
            scope: true,
            link: function(scope, element) {
                scope.$watch('dates', function(newValue, oldValue) {
                    if(newValue && newValue != oldValue){
                        var dateFilter,
                            startDate = moment(new Date(newValue.startDate)).format('MM/DD/YYYY'),
                            endDate = moment(new Date(newValue.endDate)).format('MM/DD/YYYY'),
                            gridOptions = scope.timesheetGridOptions || scope.grid.options,
                            dateFilterIndex = _.findIndex(gridOptions.reportFilters, function(reportFilter) {
                                return reportFilter.field == 'date';
                            });

                            if(dateFilterIndex < 0){
                                    dateFilterIndex = gridOptions.reportFilters.length || 0;
                                    dateFilter = {
                                        "field": "date"
                                    };

                                    gridOptions.reportFilters.push(dateFilter);
                            }

                            gridOptions.reportFilters[dateFilterIndex].start = startDate;
                            gridOptions.reportFilters[dateFilterIndex].end = endDate;

                            element.find('input').val(startDate + ' - ' + endDate);

                            preferences.set('reportFilter', newValue);
                    }
                });

                if(preferences.get('reportFilter')){
                    var savedDate = preferences.get('reportFilter');

                    if(savedDate){
                        $timeout(function() {
                            scope.dates = {
                                startDate: new Date(savedDate.startDate),
                                endDate: new Date(savedDate.endDate)
                            };
                        });
                    }
                }
                else{
                    $timeout(function() {
                        scope.dates = {
                            startDate: scope.ranges['This month'][0],
                            endDate: scope.ranges['This month'][1]
                        };
                    });
                }
            },
            templateUrl: 'components/reportDatePicker/reportDatePicker.html'
        };
    }]);
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
    .directive('timesheetIntro', ['notifyingService', '$timeout', '$rootScope', function(notifyingService, $timeout, $rootScope) {
        return {
            scope: true,
            link: function(scope, element, attributes) {
                $timeout(function() {
                    scope.IntroOptions = {
                        steps: scope.introSteps,
                        showStepNumbers: false,
                        showBullets: true,
                        exitOnOverlayClick: true,
                        exitOnEsc: true,
                        nextLabel: 'Next',
                        prevLabel: 'Prev',
                        skipLabel: 'Skip',
                        doneLabel: 'Skip'
                    };
                    notifyingService.subscribe('startIntro', function() {
                        $('.main-container').animate({ scrollTop: 0 }, 400);
                        scope.startIntro();
                    }, scope);
                });

                scope.introExit = function () {
                    $rootScope.introIsActive = false;
                };
            },
            templateUrl: 'components/timesheetIntro/timesheetIntro.html'
        }
    }]);
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
    .directive('cuttedComment', ['$timeout', function ($timeout) {
        return {
            scope: true,
            link: function (scope, element, attrs) {
                var comment = element.find('span.aggreagated-comment'),
                    parent = element.parent('.ui-grid-cell');

                scope.isNotFitsTheCell = false;

                scope.measureCell = function() {
                    //IE-related measurement
                    comment.addClass('aggregated-comment-measure');

                    $timeout(function() {
                        scope.isNotFitsTheCell = comment.outerWidth() > parent.outerWidth() - 20; //padding
                        comment.removeClass('aggregated-comment-measure');
                    });
                };

                scope.$on('activeReportChanged', function() {
                    $timeout(function() {
                        scope.measureCell();
                    });
                });
            },
            templateUrl: 'components/cuttedComment/cuttedComment.html'
        };
    }]);
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
    .directive('timeMask', function () {
        return {
            scope: true,
            link: function (scope, element, attrs) {
                var input = element.find('input');
                var timePlaceholder = '';

                input.on('blur', function(){
                    var time = $(this).val();

                    if(time != ''){
                        $(this).val(time);
                    }
                    $(this).attr('placeholder', timePlaceholder);
                });

                input.on('focus', function(){
                    var time = $(this).val();

                    if(time != '' && time.slice(-1) == 'h'){
                        $(this).val(time.slice(0, -1));
                    }
                    timePlaceholder = $(this).attr('placeholder');
                    $(this).removeAttr("placeholder");
                });

                input.on('keypress', function (event) {
                    var indexOfDot = $(this).val().indexOf(".");
                    if (event.which != 8 &&
                        (event.key != '.' && isNaN(String.fromCharCode(event.which))) ||
                        (indexOfDot > -1 && event.key == '.')) {
                        event.preventDefault(); //stop character from entering input
                    }
                });

                // scope.$watch(attrs.watch, function(newValue, oldValue) {
                //     //if(scope.project){
                //         var time = input.val();
                //
                //         if(time && time.slice(-1) !== 'h'){
                //             input.val(time + 'h')
                //         }
                //     //}
                // });
            },
            templateUrl: function (element) {
                var activeTemplate;

                if(element.hasClass('timesheet-hours')){
                    activeTemplate = 'components/timeMask/timeMask.html';
                }
                else{
                    activeTemplate = 'components/timeMask/workloadMask.html';
                }

                return activeTemplate
            }
        };
    });
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
    .directive('timesheetComment', function() {
        return {
            scope: true,
            link: function(scope, element) {
                element.find('.timesheet-comment').on('keydown', function(event) {
                    if(event.ctrlKey){
                        if(event.keyCode == 40){
                            var nextComment = $(this).parents('tr').next().find('.timesheet-comment');

                            nextComment.val($(this).val())
                                       .trigger('input')
                                       .focus();
                        }
                        else if(event.keyCode == 38){
                            var prevComment = $(this).parents('tr').prev().find('.timesheet-comment');

                            prevComment.val($(this).val())
                                .trigger('input')
                                .focus();
                        }
                    }
                });
            },
            templateUrl: 'components/timesheetComment/timesheetComment.html'
        };
    });
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

angular.module('mifortTimesheet.login', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/login', {
            templateUrl: 'login/loginView.html',
            controller: 'loginController'
        });
    }])

    .controller('loginController', ['$scope', '$location', 'loginService', 'preferences', '$rootScope', function ($scope, $location, loginService, preferences, $rootScope) {
        $rootScope.isLoggedIn = false;

        $scope.user = loginService.getUser().success(function (data) {
            if(data){
                preferences.set('user', data);

                if(data.companyId){
                    $rootScope.companyId = data.companyId;
                    $location.path('/timesheet');
                }
                else{
                    $location.path('/company-create');
                }

                $rootScope.isLoggedIn = true;
            }
        }).error(function() {
            $rootScope.isNotLoggedIn = true;
        });

        $scope.googleLogin = function(){
            window.location ='/googlelogin';
        };

        $scope.login = function () {
            $location.path('/timesheet');
            $rootScope.isLoggedIn = true;
        };
    }]);
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

angular.module('mifortTimesheet.login').factory('loginService',
    ['$http', function($http) {
        return {
            getUser: function(customUserId) {
                if(customUserId){
                    return $http.get('api/v1/user/' + customUserId);
                }
                else{
                    return $http.get('api/v1/user');
                }
            }
        };
    }
    ]);

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

angular.module('mifortTimesheet.company', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/company-create', {
            templateUrl: 'company/companyView.html',
            controller: 'companyController'
        });

        $routeProvider.when('/company', {
            templateUrl: 'company/companyEditView.html',
            controller: 'companyController'
        });
    }])

    .controller('companyController', ['$scope', '$location', 'companyService', 'preferences', '$rootScope', 'Notification',
        function ($scope, $location, companyService, preferences, $rootScope, Notification) {
        $scope.user = preferences.get('user');

        $scope.company = {
            name: null,
            emails: []
        };

        $scope.possibleRoles = [
            'Owner',
            'Manager',
            'Employee'
        ];

        if($location.path() == '/company'){
            companyService.getCompany($scope.user.companyId).success(function(company) {
                $scope.company = company;
                $scope.company.emails = [];
                $scope.introSteps.push({
                    element: '#step4',
                    intro: "<p>Table with all invited employees and roles.</p>" +
                    "<p><strong>Name</strong> column shows employee\'s Name if he already logged in and shared google account data, otherwise his email will be shown instead of name.</p>" +
                    "<p><strong>Role</strong> column shows the assigned role of employee. Company owner can change employee's roles and remove an employee from company.</p>" +
                    "<p>Pressing the Continue button saves all data and redirect to Projects page.</p>",
                    position: 'top'
                })
            });

            getEmployees();
        }

        function getEmployees(){
            companyService.getCompanyEmployees($scope.user.companyId).success(function(companyEmployees) {
                $scope.companyEmployees = companyEmployees;
            });
        }

        $scope.introSteps = [
            {
                element: '#step1',
                intro: "<p>Use this field to change the company name.</p>",
                position: 'bottom'
            },
            {
                element: '#step2',
                intro: "<p>Invite more employees by adding their emails to the \"Invite Employees\" field splitted by comma.</p>",
                position: 'left'
            },
            {
                element: '#step3',
                intro: "<p>Pressing the Invite button will send the emails to invited employees and add them to \"Invited Employees\" table to change company roles.</p>",
                position: 'top'
            }
        ];

        $scope.createCompany = function () {
            companyService.createCompany($scope.company).success(function (data) {
                $scope.user.companyId = data._id;
                preferences.set('user', $scope.user);
                $rootScope.companyId = data._id;
                $location.path('/calendar');
            });
        };

        $scope.saveCompany = function () {
            companyService.saveCompany($scope.company).success(function (data) {
                Notification.success('Changes saved');
                $rootScope.$broadcast('companyNameChanged', data.name);
            });
        };

        $scope.inviteEmployees = function() {
            companyService.saveCompany($scope.company).success(function () {
                getEmployees();
                $scope.company.emails = [];
                Notification.success('Changes saved');
            });
        };

        $scope.changeRole = function(employee, role) {
            employee. role = role;
            companyService.changeRole(employee).success(function() {
                Notification.success('Changes saved');
            });
        };

        $scope.removeEmployee = function(employee) {
            $scope.companyEmployees = _.filter($scope.companyEmployees, function(companyEmployee){
                return companyEmployee._id != employee._id;
            });
            companyService.removeEmployee(employee._id).success(function() {
                Notification.success('Changes saved');
            });
        };

        $scope.$watch('company.emails', function (newValue) {
            if (newValue && typeof newValue == 'string') {
                $scope.company.emails = newValue.split(/[\s,]+/);
            }
        }, true);
    }]);
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

angular.module('mifortTimesheet.company').factory('companyService',
    ['$http', function($http) {
        return {
            createCompany: function(company) {
                return $http.put('api/v1/company', company);
            },
            getCompany: function(companyId) {
                return $http.get('api/v1/company/' + companyId);
            },
            getCompanyEmployees: function(companyId) {
                return $http.get('api/v1/user/company/' + companyId);
            },
            changeRole: function(employee) {
                return $http.post('api/v1/user/update-role/', employee);
            },
            removeEmployee: function(employeeId) {
                return $http.delete('api/v1/user/' + employeeId);
            },
            saveCompany: function(company) {
                return $http.post('api/v1/company', company);
            }
        }
    }
    ]);

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

angular.module('mifortTimesheet.projects', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/projects', {
            templateUrl: 'projects/projectsView.html',
            controller: 'projectsController'
        });
    }])

    .controller('projectsController', ['$scope', 'projectsService', 'preferences', 'topPanelService', 'Notification',
        function($scope, projectsService, preferences, topPanelService, Notification) {
            var companyId = preferences.get('user').companyId,
                timer = null,
                basicSteps = [
                    {
                        element: '#step1',
                        intro: "<p>This section contains a company project. </p>" +
                        "<p>Each project table has three columns: </p>" +
                        "<ul class=\"dotted-list\"><li><strong>Assignment</strong> - contains the dropdown list with all possible assignments for current company (i.e. Developer, QA, Manager, Team Lead etc.). </li>" +
                        "<li><strong>Workload</strong> - set\'s the employee\'s default workload for the current project. </li>" +
                        "<li><strong>Person</strong> - contains the search/dropdown with all company\'s employees. Each assigned employee could be deassigned by pressing the red cross button next to that employees table row. " +
                        "Each employee could be assigned on any project any number of times with any roles.</li></ul>",
                        position: 'bottom'
                    },
                    {
                        element: '#step2',
                        intro: "<p>Pressing the blue Diamond button as well as \"<strong>Add Project</strong>\" link at the top of page will create a new empty project.</p>",
                        position: 'left'
                    },
                    {
                        element: '#step4',
                        intro: "<p>Click on the Project Name will allow you to change it.</p>" +
                        "<p>Pressing the arrow icon will minimize or maximize the project.</p>",
                        position: 'right'
                    }
                ],
                activeProjectsIntroSteps = [
                    {
                        element: '#step3',
                        intro: "<p>Pressing the \"archive\" button will close and archive the project and make it inactive," +
                        "so user will not be able to log time on this project.</p>",
                        position: 'left'
                    },
                    {
                        element: '#step5',
                        intro: "<p>Pressing the \"dearchive\" button will dearchive the project and make it active back," +
                        "so user will be able to log time on this project.</p>",
                        position: 'left'
                    },
                    {
                        element: '#step6',
                        intro: "<p>Pressing the \"remove\" button will delete archived project completely. " +
                        "All timesheets with logged time for deleted projects will not be deleted.</p>",
                        position: 'left'
                    }
                ];

            $scope.showActiveProjects = true;

            $scope.projectsKeys = [
                'Employee',
                'Workload'
            ];
            $scope.assignments = [
                'Developer',
                'QA'
            ];
            $scope.currentProjectIndex = 0;

            projectsService.getProjects(companyId).success(function(projects) {
                if(projects.length){
                    $scope.projects = projects;
                    $scope.availablePositions = projects[0].availablePositions;

                    $scope.projects.forEach(function(project) {
                        projectsService.getAssignedEmployers(project._id).success(function(assignedEmployers) {
                            project.assignedEmployers = assignedEmployers || [];
                            project.isCollapsed = !project.active;
                            project.projectEdit = false;
                            project.loading = false;
                        });
                    });
                }
                else{
                    $scope.projects = [];
                }
            });

            $scope.introSteps = [
                {
                    element: '#step1',
                    intro: "<p>This section contains a company project. </p>" +
                    "<p>Each project table has three columns: </p>" +
                    "<ul class=\"dotted-list\"><li><strong>Assignment</strong> - contains the dropdown list with all possible assignments for current company (i.e. Developer, QA, Manager, Team Lead etc.). </li>" +
                    "<li><strong>Workload</strong> - set\'s the employee\'s default workload for the current project. </li>" +
                    "<li><strong>Person</strong> - contains the search/dropdown with all company\'s employees. Each assigned employee could be deassigned by pressing the red cross button next to that employees table row. " +
                    "Each employee could be assigned on any project any number of times with any roles.</li></ul>",
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: "<p>Pressing the blue Diamond button as well as \"<strong>Add Project</strong>\" link at the top of page will create a new empty project.</p>",
                    position: 'left'
                },
                {
                    element: '#step3',
                    intro: "<p>Pressing the \"archive\" button will close and archive the project and make it inactive," +
                    "so user will not be able to log time on this project.</p>" +
                    "<p>Pressing the \"dearchive\" button will dearchive the project and make it active back," +
                    "so user will be able to log time on this project.</p>" +
                    "<p>Pressing the \"remove\" button will delete archived project completely. " +
                    "All timesheets with logged time for deleted projects will not be deleted.</p>",
                    position: 'left'
                },
                {
                    element: '#step4',
                    intro: "<p>Click on the Project Name will allow you to change it.</p>" +
                    "<p>Pressing the arrow icon will minimize or maximize the project.</p>",
                    position: 'right'
                }
            ];

            projectsService.getCompanyEmployers(companyId).success(function(employees) {
                $scope.companyEmployees = employees;
            });

            $scope.changeProjectName = function(project) {
                projectsService.saveOrCreateProject(project).success(function() {
                    Notification.success('Changes saved');
                });
            };

            $scope.addProject = function() {
                var newProject = {
                    name: 'New Project',
                    companyId: companyId
                };

                $scope.showActiveProjects = true;

                projectsService.saveOrCreateProject(newProject).success(function(project) {
                    project.assignedEmployers = [];
                    $scope.projects.unshift(project);
                    Notification.success('Changes saved');
                });

            };

            $scope.saveAssignment = function(project, assignedEmployee, employee, previousEmployeeId, assignmentIndex) {
                projectsService.saveAssignment(project._id, assignedEmployee).success(function() {
                    Notification.success('Changes saved');
                });
            };

            $scope.archiveProject = function(project, projectIndex) {
                if(project._id){
                    projectsService.archiveProject(project._id).success(function(data) {
                        project.active = false;
                        project.isCollapsed = true;
                    });
                }
            };

            $scope.dearchiveProject = function(project) {
                if(project._id){
                    projectsService.dearchiveProject(project._id).success(function(data) {
                        project.active = true;
                        project.isCollapsed = false;
                    });
                }
            };

            $scope.removeProject = function(project, projectIndex) {
                $scope.projects.splice(projectIndex, 1);

                if(project._id){
                    projectsService.removeProject(project._id).success(function() {
                        Notification.success('Changes saved');
                    });
                }
            };

            $scope.changeRole = function(project, assignedEmployee, assignment, availablePosition) {
                assignment.role = availablePosition;
                $scope.saveAssignment(project, assignedEmployee);
            };

            $scope.changeUser = function(project, assignedEmployee, companyEmployeeId, assignmentIndex) {
                var userLostAssignment = _.findWhere(project.assignedEmployers, {_id: assignedEmployee._id}),
                    userGotAssignment = _.findWhere(project.assignedEmployers, {_id: companyEmployeeId}) ||
                        _.findWhere($scope.companyEmployees, {_id: companyEmployeeId}),
                    assignment = userLostAssignment.assignments[assignmentIndex];

                assignment.userId = userGotAssignment._id;

                //if user already assigned somewhere
                if(userGotAssignment.assignments && userGotAssignment.assignments.length){
                    userGotAssignment.assignments.push(assignment);
                }
                else{
                    userGotAssignment.assignments = [assignment];

                    if(!_.findWhere(project.assignedEmployers, {_id: companyEmployeeId})){
                        project.assignedEmployers.push(userGotAssignment);
                    }
                }

                userLostAssignment.assignments.splice(assignmentIndex, 1);

                //remove assignment for one and add for another
                $scope.saveAssignment(project, userLostAssignment);
                $scope.saveAssignment(project, userGotAssignment);
            };

            $scope.addAssignment = function(project, employee) {
                var userForAssignment = _.findWhere($scope.companyEmployees, {_id: employee._id});

                if(userForAssignment){
                    var userWithAssignments = _.findWhere(project.assignedEmployers, {_id: employee._id}),
                        newAssignment = {
                            projectId: project._id,
                            projectName: project.name,
                            role: project.availablePositions[0],
                            userId: userForAssignment._id,
                            workload: ''
                        };

                    //if user has assignments
                    if(userWithAssignments){
                        userWithAssignments.assignments.push(newAssignment);
                    }
                    else{
                        userForAssignment.assignments = [newAssignment];
                        project.assignedEmployers.push(userForAssignment);
                    }

                    $scope.saveAssignment(project, _.clone(userWithAssignments || userForAssignment));
                }
            };

            $scope.removeAssignment = function(project, assignedEmployee, assignmentIndex) {
                assignedEmployee.assignments.splice(assignmentIndex, 1);
                $scope.saveAssignment(project, assignedEmployee);
            };

            $scope.$on('handleBroadcast', function() {
                if(topPanelService.linkName = 'project'){
                    $scope.addProject();
                }
            });
        }]);
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

angular.module('mifortTimesheet.projects').factory('projectsService',
    ['$http', function($http) {
        return {
            saveAssignment: function(projectId, user) {
                return $http.post('api/v1/user/assignment/' + projectId, user);
            },
            saveOrCreateProject: function(project) {
                return $http.post('api/v1/project/', project);
            },
            getProjects: function(companyId) {
                return $http.get('api/v1/project/list?companyId=' + companyId);
            },
            getAssignedEmployers: function(projectId) {
                return $http.get('api/v1/user/project/' + projectId);
            },
            getCompanyEmployers: function(companyId) {
                return $http.get('api/v1/user/company/' + companyId);
            },
            archiveProject: function(projectId) {
                return $http.get('api/v1/project/deactivate/' + projectId);
            },
            dearchiveProject: function(projectId) {
                return $http.get('api/v1/project/activate/' + projectId);
            },
            removeProject: function(projectId) {
                return $http.delete('api/v1/project/' + projectId);
            }
        }
    }
    ]);

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

angular.module('mifortTimesheet.timesheet', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/timesheet', {
            templateUrl: 'timesheet/timesheetView.html',
            controller: 'timesheetController'
        });

        $routeProvider.when('/timesheet/:userId', {
            templateUrl: 'timesheet/timesheetView.html',
            controller: 'timesheetController'
        });
    }])

    .controller('timesheetController', ['$scope', 'timesheetService', 'calendarService', 'preferences', 'loginService', '$routeParams', '$timeout', 'Notification', "$q", "projectSummaryService",
        function($scope, timesheetService, calendarService, preferences, loginService, $routeParams, $timeout, Notification, $q, projectSummaryService) {
            var user;

            $scope.projects = [];
            $scope.currentPeriodIndex = 0;
            $scope.timesheetKeys = timesheetService.getTimesheetKeys();
            $scope.logs = [];
            $scope.filteredLogs = [];
            $scope.customUserId = $routeParams.userId;
            $scope.grid = {options: {reportFilters: []}};

            loginService.getUser($scope.customUserId).success(function(loggedUser) {
                if(loggedUser){
                    $scope.loading = true;

                    var uniqueProjectAssignments = [],
                        loadedProjects = 0;

                    $scope.customUserName = loggedUser.displayName;
                    user = loggedUser;

                    user.assignments.forEach(function(assignment) {
                        uniqueProjectAssignments.push(assignment.projectId);
                    });
                    uniqueProjectAssignments = _.uniq(uniqueProjectAssignments);

                    //get timesheets
                    if(!uniqueProjectAssignments.length){
                        $scope.noAssignments = true;
                    }

                    uniqueProjectAssignments.forEach(function(assignment, index) {
                        timesheetService.getProject(assignment).success(function(project) {
                            if(project && project.active){
                                project.assignments = _.where(user.assignments, {projectId: project._id});

                                $scope.projects.splice(index, 0, project);
                            }

                            loadedProjects++;
                        }).then(function() {
                            //when all projects are loaded
                            $scope.projects = $scope.getSortedProjects();

                            var filterProjects = $scope.projects.map(function(project) {
                                return {_id: project._id, name: project.name};
                            });
                            $scope.grid.options.reportFilters = [{field: "projects", value: filterProjects}];

                            if(loadedProjects == uniqueProjectAssignments.length){
                                $scope.init();
                            }
                        });
                    });
                }
            });

            $scope.addLogs = function (period, index) {
                $scope.logs.push({index: index, data: $scope.groupDatePeriodsProjects(index)});
            };

            $scope.currentPeriodLogsLoaded = function () {
                $scope.$root.$emit('projectsAndLogsLoaded', { projects: $scope.projects, logs: $scope.logs, index: $scope.currentPeriodIndex});
            };

            $scope.init = function() {
                var promises = [];

                $scope.projects.forEach(function(project) {
                    var today = moment();

                    //scroll into cuttent week
                    project.periods.forEach(function(period, periodIndex) {
                        var momentStart = moment(new Date(period.start)),
                            momentEnd = moment(new Date(period.end));

                        if(today.isBetween(momentStart, momentEnd) || today.isSame(momentStart, 'day') || today.isSame(momentEnd, 'day')){
                            $scope.currentPeriodIndex = +preferences.get('currentPeriodIndex') || periodIndex || 0;
                        }
                    });

                    project.periods.forEach(function (period, index) {
                        promises.push(initPeriod(project, index));
                    })
                });

                $q.all(promises).then(function (){
                    $scope.projects[0].periods.forEach(function (period, index) {
                        $scope.addLogs(period, index);
                    });
                    initWatchers("logs");
                    $scope.currentPeriodLogsLoaded();

                    $scope.filteredLogs = $scope.getFilteredDates();
                    $scope.watchFilterChanges();

                    $scope.projects.forEach(function (project) {
                        applyProjectDefaultValues(project, $scope.currentPeriodIndex);
                    });

                    $scope.loading = false;
                });
            };

            $scope.introSteps = timesheetService.introSteps;

            function initPeriod(project, periodIndex) {
                var startDate = project.periods[periodIndex].start,
                    endDate = project.periods[periodIndex].end;

                project.periods[periodIndex].timesheet = [];
                project.periods[periodIndex].userTimesheets = [];

                return timesheetService.getTimesheet(user._id, project._id, startDate, endDate).success(function(dataTimesheet) {
                    project.periods[periodIndex].userTimesheets.push.apply(project.periods[periodIndex].userTimesheets, dataTimesheet.timesheet);
                }).then(function() {

                    generateDaysTemplates(project, periodIndex);
                    applyUserTimesheets(project, periodIndex);
                });
            }

            function applyUserTimesheets(project, periodIndex) {
                var period = project.periods[periodIndex];

                project.periods[periodIndex].userTimesheets.forEach(function(day, index) {
                    var timesheetDayIndex = _.findIndex(period.timesheet, {date: moment(new Date(day.date)).format("MM/DD/YYYY")}),
                        sameDateDays,
                        lastDayWithSameDate;

                    if(timesheetDayIndex != -1){
                        sameDateDays = _.where(period.timesheet, {date: moment(new Date(day.date)).format("MM/DD/YYYY")});
                        lastDayWithSameDate = _.findIndex(period.timesheet, {_id: sameDateDays[sameDateDays.length - 1]._id});

                        //reset client saved data
                        delete day.color;
                        delete day.placeholder;
                        day.timePlaceholder = sameDateDays[0].timePlaceholder;

                        //if current iterated log is not the first for this date to push
                        if(project.periods[periodIndex].timesheet[timesheetDayIndex] && project.periods[periodIndex].timesheet[timesheetDayIndex].date == day.date){
                            if(!period.timesheet[timesheetDayIndex]._id){
                                day.isFirstDayRecord = true;
                                period.timesheet[timesheetDayIndex] = day;
                            }
                            else{
                                day.isFirstDayRecord = false;
                                day.position = day.position ? day.position : period.timesheet[timesheetDayIndex].position + 1;
                                period.timesheet.splice(lastDayWithSameDate + 1, 0, day);
                            }
                        }
                        else{
                            day.isFirstDayRecord = true;
                            if(!_.findWhere(period.timesheet, {date: day.date}).comment){
                                _.findWhere(period.timesheet, {date: day.date}).comment = day.comment;
                            }
                            angular.extend(period.timesheet[timesheetDayIndex], day);
                        }
                    }
                });
            }

            function applyProjectDefaultValues(project) {
                if(project.defaultValues){
                    project.defaultValues.forEach(function(day) {
                        var existedDays = $scope.getSameDateDays($scope.getLogDates(), day.date);

                        if(existedDays.length && day.dayId){
                            existedDays.forEach(function(existedDay) {
                                var assignedDayType = _.findWhere(project.dayTypes, {id: day.dayId});

                                existedDay.color = assignedDayType.color;
                                existedDay.placeholder = assignedDayType.name;

                                if(!existedDay.timePlaceholder){
                                    existedDay.timePlaceholder = assignedDayType.time;
                                }
                                if(assignedDayType.time < existedDay.timePlaceholder){
                                    existedDay.timePlaceholder = assignedDayType.time;
                                }
                            });
                        }
                    });
                }
            }

            function generateDaysTemplates(project, periodIndex) {
                var startDate = moment(new Date(project.periods[periodIndex].start)),
                    endDate = moment(new Date(project.periods[periodIndex].end)),
                    daysToGenerate = endDate.diff(startDate, 'days'),
                    userRole = project.assignments[0].role,
                    timePlaceholder = project.assignments[0].workload;

                for(var i = 0; i < daysToGenerate + 1; i++){
                    var dayToPush;

                    //TODO: to template
                    project.template.userId = user._id;
                    delete project.template.time;

                    dayToPush = _.clone(project.template);
                    dayToPush.date = angular.copy(startDate).add(i, 'days').format("MM/DD/YYYY");
                    dayToPush.role = userRole;
                    dayToPush.isFirstDayRecord = true;
                    dayToPush.userName = user.displayName;
                    dayToPush.timePlaceholder = timePlaceholder;

                    project.periods[periodIndex].timesheet.push(dayToPush);
                }
            }

            function initWatchers(property) {
                var timer = null;

                $scope.$watch(property, function (newValue, oldValue) {
                    var newLogs = newValue[$scope.currentPeriodIndex].data,
                        oldLogs = oldValue[$scope.currentPeriodIndex].data;
                    if (newLogs.length >= oldLogs.length) {

                        var newValueToCompare = $scope.getNotEmptyLogs(newLogs).map(function (log) {
                            return {projectId: log.projectId, time: log.time, comment: log.comment};
                        });

                        var oldValueToCompare = $scope.getNotEmptyLogs(oldLogs).map(function (log) {
                            return {projectId: log.projectId, time: log.time, comment: log.comment};
                        });

                        if (!_.isEqual(newValueToCompare, oldValueToCompare)) {

                            var dates = $scope.getNotEmptyDates();
                            var timesheetToSave = angular.copy(dates);

                            timesheetToSave.map(function (log) {
                                if (log.time !== '' && log.time !== null) {
                                    log.time = +log.time;
                                }
                                if (log.time == "") {
                                    log.time = null;
                                }
                                return log;
                            });

                            if (timer) {
                                $timeout.cancel(timer);
                            }

                            var logsToDelete = angular.copy($scope.getLogsToDelete());

                            if (logsToDelete.length || timesheetToSave.length) {
                                timer = $timeout(function () {
                                    timesheetService.updateTimesheet(user._id, timesheetToSave, logsToDelete).success(function (data) {
                                        var periodTimesheet = $scope.getNotEmptyDates(),
                                            noIdLog = _.find(periodTimesheet, function (log) {
                                                return !log._id;
                                            });

                                        if (noIdLog) {
                                            var index = 0;
                                            dates.forEach(function (item) {
                                                if (item.time || item.comment) {
                                                    if (!item._id) {
                                                        item._id = data.timesheet[index]._id;
                                                    }
                                                    index++;
                                                }
                                            });
                                        }
                                        Notification.success('Changes saved');
                                    });
                                }, 500);
                            }
                        }
                    }
                }, true);
            }

            $scope.calcNewLogPosition = function (logs, date) {
                var sameDateDays = $scope.getSameDateDays(logs, date);

                var maxPosition = 0;

                sameDateDays.forEach(function(sameDateDay) {
                    if(sameDateDay.position > maxPosition){
                        maxPosition = sameDateDay.position;
                    }
                });

                return maxPosition + 1;
            };

            $scope.getSameDateDays = function (logs, date) {
                return _.filter(logs, function (log) {
                    return log.date == date;
                });
            };

            $scope.addLog = function(log, project) {
                var newRow = angular.copy(project.template),
                    currentPeriod = $scope.getLogDates(),
                    dayPeriodIndex = _.findIndex(currentPeriod, {date: log.date});

                newRow.date = log.date;
                newRow.userName = log.userName;
                newRow.color = log.color;
                newRow.placeholder = log.placeholder;
                newRow.timePlaceholder = project.assignments[0].workload;
                newRow.role = log.role;
                newRow.isFirstDayRecord = false;
                newRow.position = $scope.calcNewLogPosition(currentPeriod, log.date);

                $scope.setDefaultProject(newRow);

                newRow.hasLog = true;
                newRow.isCreatedManually = true;
                currentPeriod.splice(dayPeriodIndex + $scope.getSameDateDays(currentPeriod, log.date).length, 0, newRow);

                $scope.filteredLogs = $scope.getFilteredDates();
            };

            $scope.removeRow = function(log, project, periodIndex) {
                var dates = $scope.getLogDates();

                if(log._id){
                    timesheetService.removeTimesheet(log).success(function() {
                        Notification.success('Changes saved');
                    });
                }

                dates.splice(dates.indexOf(log), 1);

                $scope.filteredLogs = $scope.getFilteredDates();
            };

            $scope.showPreviousPeriod = function(projects) {
                var lastPeriod = $scope.currentPeriodIndex;

                if($scope.currentPeriodIndex){
                    $scope.currentPeriodIndex--;

                    var promises = [];
                    projects.forEach(function(project) {
                        project.lastPeriodRecords = project.periods[lastPeriod].timesheet.length;

                        if(!project.periods[$scope.currentPeriodIndex].timesheet){
                            promises.push(initPeriod(project, $scope.currentPeriodIndex));
                        }
                    });

                    $q.all(promises).then(function() {

                        $scope.currentPeriodLogsLoaded();

                        $scope.filteredLogs = $scope.getFilteredDates();
                    });
                }

                preferences.set('currentPeriodIndex', $scope.currentPeriodIndex);
            };

            $scope.showNextPeriod = function(projects) {
                var lastPeriod = $scope.currentPeriodIndex;

                if($scope.currentPeriodIndex < projects[0].periods.length - 1){
                    $scope.currentPeriodIndex++;

                    var promises = [];
                    projects.forEach(function(project) {
                        project.lastPeriodRecords = project.periods[lastPeriod].timesheet.length;

                        if(!project.periods[$scope.currentPeriodIndex].timesheet){
                            promises.push(initPeriod(project, $scope.currentPeriodIndex));
                        }
                    });

                    $q.all(promises).then(function() {

                        $scope.currentPeriodLogsLoaded();

                        $scope.filteredLogs = $scope.getFilteredDates();
                    });
                }

                preferences.set('currentPeriodIndex', $scope.currentPeriodIndex);
            };

            $scope.getCurrentLog = function () {
                return _.findWhere($scope.logs, {index: $scope.currentPeriodIndex});
            };

            $scope.getLogDates = function () {
                var log = $scope.getCurrentLog();
                return log ? log.data : [];
            };

            $scope.getCheckedProjectFilters = function () {
                var filterProjects = _.findWhere($scope.grid.options.reportFilters, {field: "projects"});
                var checkedProjects = _.filter(filterProjects.value, {isChecked: true});
                return checkedProjects.length ? checkedProjects : filterProjects.value;
            };

            $scope.getFilteredLogs = function (logs) {
                if (!logs.length) return [];

                var checkedProjects = $scope.getCheckedProjectFilters();
                return _.filter(logs, function (logPeriod) {
                    return _.filter(checkedProjects, {_id: logPeriod.projectId}).length > 0;
                });
            };

            $scope.onSearchProjectByText = function () {
                var text = this.$parent.searchProjectByText.toLocaleLowerCase();

                var filterProjects = $scope.projects.map(function(project) {
                    return {_id: project._id, name: project.name};
                });
                $scope.grid.options.reportFilters = [{field: "projects", value: filterProjects}];
                var filterProjectsByName = _.filter($scope.grid.options.reportFilters[0].value, function (filter) {
                    return filter.name.toLowerCase().startsWith(text);
                });
                filterProjectsByName.forEach(function (project) {
                    project.isChecked = false;
                });
                $scope.grid.options.reportFilters[0].value = filterProjectsByName;
            };

            $scope.getFilteredDates = function () {
                var data = $scope.getLogDates();
                var filteredLogs = $scope.getFilteredLogs(data);
                var startDate = moment(new Date($scope.projects[0].periods[$scope.currentPeriodIndex].start)),
                    endDate = moment(new Date($scope.projects[0].periods[$scope.currentPeriodIndex].end)),
                    daysToGenerate = endDate.diff(startDate, 'days');

                var logs = [];
                for(var i = 0; i < daysToGenerate + 1; i++) {
                    var date = angular.copy(startDate).add(i, 'days').format("MM/DD/YYYY");

                    var logsOnDate = $scope.getSameDateDays(filteredLogs, date);

                    if (!logsOnDate.length) {
                        var newRow = angular.copy(data[0]);
                        newRow.date = date;
                        newRow.time = null;
                        newRow.comment = null;
                        newRow._id = null;
                        newRow.isCreatedManually = false;
                        newRow.position = $scope.calcNewLogPosition(data, date);

                        $scope.setDefaultProject(newRow);
                        newRow.isFirstDayRecord = $scope.isFirstDayRecord(logs, date);

                        logs.push(newRow);

                        var dayPeriodIndex = _.findIndex(data, {date: date});
                        data.splice(dayPeriodIndex + $scope.getSameDateDays(data, date).length, 0, newRow);

                        applyProjectDefaultValues($scope.projects[0], $scope.currentPeriodIndex);
                    }
                    else {
                        var wasAdded = false;
                        logsOnDate.forEach(function (log, index) {
                            if (log._id || log.time || log.comment || log.isCreatedManually ||
                                (!index && $scope.isAtOrAfterIndexCreatedManuallyLog(index, logsOnDate))) {
                                log.isFirstDayRecord = $scope.isFirstDayRecord(logs, log.date);

                                logs.push(log);

                                applyProjectDefaultValues($scope.projects[0], $scope.currentPeriodIndex);

                                wasAdded = true;
                            }
                        });
                        if (!wasAdded) {
                            var log = logsOnDate[0];

                            log.isFirstDayRecord = $scope.isFirstDayRecord(logs, log.date);

                            logs.push(log);

                            applyProjectDefaultValues($scope.projects[0], $scope.currentPeriodIndex);
                        }
                    }
                }

                return logs;
            };

            $scope.isAtOrAfterIndexCreatedManuallyLog = function (index, logs) {
                for (var i = index; i < logs.length; i++) {
                    if (logs[i].isCreatedManually) {
                        return true;
                    }
                }
                return false;
            };

            $scope.getSortedProjects = function () {
                return $scope.projects.sort(function(a, b) {
                    if (a.assignments[0].workload && !b.assignments[0].workload) {
                        return -1;
                    }
                    if (!a.assignments[0].workload && b.assignments[0].workload) {
                        return 1;
                    }
                    if (a.assignments[0].workload && b.assignments[0].workload) {
                        if (+a.assignments[0].workload > +b.assignments[0].workload) {
                            return -1;
                        }
                        if (+a.assignments[0].workload < +b.assignments[0].workload) {
                            return 1;
                        }
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    return 0;
                });
            };

            $scope.getNotEmptyLogs = function (logs) {
                return _.filter(logs, function (item) {
                    return item.time || item.comment;
                });
            };

            $scope.getNotEmptyDates = function () {
                var dates = $scope.getLogDates();
                return $scope.getNotEmptyLogs(dates);
            };

            $scope.getLogsToDelete = function () {
                var dates = $scope.getLogDates();
                return _.filter(dates, function(item) {
                    return !item.time && !item.comment && item._id;
                });
            };

            $scope.status = {
                isOpen: false
            };

            $scope.toggleDropdown = function($event) {
                $event.preventDefault();
                $event.stopPropagation();
                $scope.status.isOpen = !$scope.status.isOpen;
            };

            $scope.assignRole = function(role, log) {
                log.role = role;
            };

            $scope.assignProject = function(projectId, log) {
                var project = _.findWhere($scope.projects, {_id: projectId});
                log.projectName = project ? project.name : '';
                log.projectId = projectId;
                log.timePlaceholder = project ? (project.assignments[0].workload ? project.assignments[0].workload : '0') : '0';
            };

            $scope.getWeekDay = function(date) {
                return moment(new Date(date)).format("dddd");
            };

            $scope.isToday = function(date) {
                return moment(new Date(date)).isSame(new Date(), 'day');
            };

            $scope.isLastTodaysRecord = function(timesheet, index) {
                if(timesheet[index + 1]){
                    return timesheet[index].date != timesheet[index + 1].date;
                }
            };

            $scope.getTotalLoggedTime = function () {
                return projectSummaryService.getTotalLoggedTime($scope.filteredLogs);
            };

            $scope.getTotalWorkload = function () {
                var projectsWithTime = projectSummaryService.getProjectsWithTime($scope.projects, $scope.getLogDates());
                return projectSummaryService.getTotalWorkloadTime(projectsWithTime);
            };

            $scope.watchFilterChanges = function () {
                $scope.$watch("grid.options.reportFilters", function (newValue, oldValue) {
                    $scope.filteredLogs = $scope.getFilteredDates();
                }, true);
            };

            $scope.groupDatePeriodsProjects = function (periodIndex) {
                if (!$scope.projects.length || !$scope.projects[0].periods[periodIndex].timesheet) return [];

                var allLogs = [];
                $scope.projects[0].periods[periodIndex].timesheet.forEach(function (logGroup) {
                    var logOfDate = $scope.getSameDateDays(allLogs, logGroup.date);

                    if (logOfDate.length == 0) {
                        $scope.projects.forEach(function (project) {
                            //if ($scope.currentPeriodIndex) {
                                var timesheet = project.periods[periodIndex].timesheet;
                                timesheet.forEach(function(log) {
                                    if (log.date == logGroup.date) {
                                        if (!log._id) {
                                            var hasLogThisDay = $scope.getSameDateDays(allLogs, log.date).length > 0;
                                            if (!hasLogThisDay && !$scope.someProjectHasLog(log.date)) {
                                                $scope.addLogToArray(log, allLogs);
                                            }
                                        }
                                        else {
                                            $scope.addLogToArray(log, allLogs);
                                        }
                                    }
                                });
                            //}
                        });
                    }
                });
                return allLogs;
            };

            $scope.setDefaultProject = function (log) {
                var checked = $scope.getCheckedProjectFilters();
                var project = checked.length ? checked[0] : $scope.projects[0];
                log.projectId = project._id;
                log.projectName = project.name;
            };

            $scope.addLogToArray = function(log, allLogs){
                if (!log.projectId) {
                    $scope.setDefaultProject(log);
                }

                allLogs.push(log);
            };

            $scope.isFirstDayRecord = function (allLogs, date) {
                return $scope.getSameDateDays(allLogs, date).length == 0;
            };

            $scope.someProjectHasLog = function (date) {
                var someProjectHasLog = false;
                $scope.projects.forEach(function (project){
                    var timesheet = project.periods[$scope.currentPeriodIndex].timesheet;
                    timesheet.forEach(function(log) {
                        if (log.date == date && (log.projectId || log.time || log.comment)) {
                            someProjectHasLog = true;
                        }
                    });
                });

                return someProjectHasLog;
            }

            $scope.isStartEndPeriodSameMonth = function (period) {
                if (period) {
                    var periodStart = moment(new Date(period.start)),
                        periodEnd = moment(new Date(period.end));
                    return periodStart.format("MMM") == periodEnd.format("MMM")
                }
                return false;
            };

            $scope.getPeriodLabel = function(period) {
                if(period){
                    var periodStart = moment(new Date(period.start)),
                        periodEnd = moment(new Date(period.end));
                    if(periodStart.format("MMM") == periodEnd.format("MMM")){
                        periodStart = periodStart.format("DD");
                    }
                    else{
                        periodStart = periodStart.format("DD MMM");
                    }
                    periodEnd = periodEnd.format("DD MMM");
                    return periodStart + ' - ' + periodEnd;
                }
                else{
                    return '';
                }
            };

        }]);
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

angular.module('mifortTimesheet.timesheet').factory('timesheetService',
    ['$http', function($http) {
        return {
            getProject: function(projectId) {
                return $http.get('api/v1/project/' + projectId);
            },
            getTimesheet: function(userId, projectId, startDate, endDate) {
                return $http.get('api/v1/timesheet/' + userId + '?projectId=' + projectId + '&startDate=' + startDate + '&endDate=' + endDate);
            },
            removeTimesheet: function(log) {
                return $http.delete('api/v1/timesheet/' + log._id);
            },
            getTimesheetKeys: function() {
                return {
                    'date': '',
                    'project': 'Project',
                    'time': 'Time, h',
                    'comment': 'Comment'
                }
            },
            updateTimesheet: function(userId, timesheet, logsToDelete) {
                return $http.post('api/v1/timesheet', {'timesheet': timesheet, 'logsToDelete': logsToDelete});
            },
            introSteps: [
                {
                    element: '#step1',
                    intro: "<p>Click on arrow will minimize/maximize the section</p>",
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: "<p>Use periods switch arrows (next and previous) to switch the period</p>",
                    position: 'left'
                },
                {
                    element: '#step3',
                    intro: "<p>Table of logs has four columns:" +
                    "<ul class=\"dotted" +
                    "gn\"><li>Date - is not editable but you can add several logs to the current date by pressing the blue plus icon next to Date field." +
                    "New row for log created for current date will have the red minus icon that will delete the log on click</li>" +
                    "<li>Role - dropdown with your roles of this project. If it is only one role it is selected by default." +
                    "There is no possibility to log time with empty role.</li>" +
                    "<li>Time - numeric input where you log." +
                    "Empty input shows placeholder with minimum of your workload (personal workload how much time this person works per day) and project assignment workload.</li>" +
                    "<li>Comment - input where you write detailed description of tasks which you done at logged time.</li></ul>" +
                    "<p>Each day will may have a background color and workload according to Timesheet Calendar option created by Owner/HR/Manager.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step4',
                    intro: "<p>Use ctrl+down or ctrl+up shortcuts when field on focus to duplicate commet for next or previous log.</p>",
                    position: 'bottom'
                }
            ]
    }
}
]);


/**
 * Created by Asus on 02.11.2016.
 */
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

angular.module('mifortTimesheet.timesheet').factory('projectSummaryService',
    ['$http', function($http) {
        var self = this;


        self.getLoggedTime = function (projectId, logs) {
            if (!projectId) return 0;

            var total = 0;
            var logs = _.filter(logs, {projectId: projectId});
            logs.forEach(function (log) {
                if (log.time) {
                    total += +log.time;
                }
            });
            return total;
        };

        self.getTotalLoggedTime = function (logs) {
            var total = 0;

            logs.forEach(function (log) {
                if (log.time) {
                    total += self.formatTime(log.time);
                }
            });
            return total;
        };

        self.getTotalWorkloadTime = function (projects) {
            if (!projects) return 0;

            return projects.length * self.getWorkload();
        };

        self.getWorkload = function () {
            return 40;
        };

        self.getProjectsWithTime = function (projects, logs) {
            var projectsWithTime = [];

            projects.forEach(function (project) {
                if (project.assignments[0].workload) {
                    projectsWithTime.push({id: project._id, name: project.name});
                }
            });
            logs.forEach(function (log) {
                if (log.time && !_.findWhere(projectsWithTime, {id: log.projectId})) {
                    projectsWithTime.push({id: log.projectId, name: log.projectName});
                }
            });

            return projectsWithTime;
        };

        self.formatTime = function (time){
            if(time && angular.isNumber(time)){
                time = time;
            }
            else if(time && time.slice(-1) == 'h'){
                time = time.slice(0, -1);
            }
            else{
                time = time == "." ? 0 : +time;
            }

            return time;
        }

        return self;
    }
    ]);


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

angular.module('mifortTimesheet.calendar', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/calendar', {
            templateUrl: 'calendar/calendarView.html',
            controller: 'calendarController'
        });
    }])

    .controller('calendarController', ['$scope', '$filter', 'calendarService', 'moment', 'preferences', 'Notification', '$anchorScroll', '$location',
        function($scope, $filter, calendarService, moment, preferences, Notification, $anchorScroll, $location) {
            $scope.daySettingsPopover = {
                templateUrl: 'daySettimgs.html'
            };
            $scope.customDayPopover = {
                templateUrl: 'customDay.html'
            };
            $scope.periodSettings = calendarService.getPeriodSettings();
            $scope.countPeriodSettings = calendarService.getCountPeriodSettings();
            $scope.weekDays = calendarService.getWeekDays();
            calendarService.getCompany(preferences.get('user').companyId).success(function (data) {
                $scope.company = data;
                if (data.periodSetting && data.countPeriodSetting) {
                    $scope.countPeriodSetting = data.countPeriodSetting;
                    $scope.periodSetting = data.periodSetting;
                } else {
                    $scope.countPeriodSetting = calendarService.getCountPeriodSettings()[0].count;
                    $scope.periodSetting = "Week";
                }
            }).then(function () {
                $scope.init();
            });

            $scope.selectedPeriod = $scope.periodSettings[0]; //default period is week
            $scope.splittedCalendar = [];
            $scope.calendarIsOpened = false;
            //check and remove
            $scope.range = function(n) {
                return new Array(n);
            };

            $scope.init = function() {
                var currentMonth = moment(new Date()).get('month');

                generateCalendar();
                initWatchers();

                $location.hash('month-' + currentMonth);
                $anchorScroll();
            };

            function generateCalendar() {
                $scope.startDate = new Date($scope.company.periods[0].start); //default for peridos split date
                $scope.calendar = [];
                $scope.splittedCalendar = [];

                var startDate = moment(new Date($scope.company.periods[0].start)),
                    endDate = moment(new Date($scope.company.periods[$scope.company.periods.length - 1].end)),
                    daysToGenerate = endDate.diff(startDate, 'days') + 1;

                for(var i = 0; i < daysToGenerate; i++){
                    var dayToPush = _.clone($scope.company.template);
                    dayToPush.date = moment(new Date(startDate)).add(i, 'days').format("MM/DD/YYYY");
                    $scope.calendar.push(dayToPush);
                }

                updateCalendarDaysWithPeriods();

                //Splitting the calendar days into tables
                $scope.calendar.forEach(function(day, index) {
                    generateCalendarTables(day, index);
                });

                applyDefaultValues();
            }

            function updateCalendarDaysWithPeriods(){
                $scope.company.periods.forEach(function(period) {
                    if(period.start){
                        var periodStartDay = _.findWhere($scope.calendar, {date: moment(new Date(period.start)).format('MM/DD/YYYY')});

                        if(periodStartDay){
                            periodStartDay.isPeriodStartDate = true;
                        }
                    }

                    if(period.end){
                        var periodEndDay = _.findWhere($scope.calendar, {date: moment(new Date(period.end)).format('MM/DD/YYYY')});

                        if(periodEndDay){
                            periodEndDay.isPeriodEndDate = true;
                        }
                    }
                });
            }

            function applyDefaultValues() {
                if($scope.company.defaultValues){
                    $scope.company.defaultValues.forEach(function(day) {
                        if(day && day.date){
                            var dayExisted = _.findWhere($scope.calendar, {date: moment(new Date(day.date)).format('MM/DD/YYYY')});
                        }

                        if(dayExisted){
                            angular.extend(dayExisted, day);
                        }
                    });
                }
            }

            function generateCalendarTables(day, index) {
                var currentDate = new Date(day.date),
                    currentDayWeek = moment(currentDate).get('week'),
                    currentDayMonth = moment(currentDate).get('month'),
                    currentDayYear = moment(currentDate).get('year') - moment(new Date()).get('year'),
                    daysBeforeCalendarStart = moment(currentDate).weekday(),
                    daysAfterCalendarEnd = $scope.calendar[index - 1] && 6 - moment(new Date($scope.calendar[index - 1].date)).weekday(),
                    generatedDay;

                if(currentDayWeek == 1 && $scope.splittedCalendar[currentDayYear - 1] && moment(currentDate).get('date') == 31){
                    currentDayWeek = 53;
                }

                function generateCurrentMonth() {
                    $scope.splittedCalendar[currentDayYear][currentDayMonth] = [];
                }

                function generateCurrentWeek() {
                    $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek] = [];
                }

                function generatePreviousMonthDays() {
                    for(var k = 0; k < daysBeforeCalendarStart; k++){
                        generatedDay = _.clone($scope.company.template);
                        generatedDay.date = moment(currentDate).subtract(k + 1, 'day').format('MM/DD/YYYY');
                        generatedDay.disabled = true;
                        $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek].unshift(generatedDay);
                    }

                    $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek].push(day);
                }

                function generateNextMonthDays() {
                    var previousMonth;

                    if($scope.splittedCalendar[currentDayYear].length && $scope.splittedCalendar[currentDayYear][currentDayMonth - 1]){
                        //get current year month
                        previousMonth = $scope.splittedCalendar[currentDayYear][currentDayMonth - 1];
                    }
                    else{
                        //get previous year month
                        previousMonth = $scope.splittedCalendar[currentDayYear - 1][$scope.splittedCalendar[currentDayYear - 1].length - 1];
                    }

                    for(var i = 0; i < daysAfterCalendarEnd; i++){
                        generatedDay = _.clone($scope.company.template);
                        generatedDay.date = moment(currentDate).add(i, 'day').format('MM/DD/YYYY');
                        generatedDay.disabled = true;
                        previousMonth[previousMonth.length - 1].push(generatedDay);
                    }
                }


                if($scope.splittedCalendar[currentDayYear]){
                    if($scope.splittedCalendar[currentDayYear][currentDayMonth]){
                        if($scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek]){
                            $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek].push(day);
                        }
                        else{
                            $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek] = [];
                            $scope.splittedCalendar[currentDayYear][currentDayMonth][currentDayWeek].push(day);
                        }
                    }
                    else{
                        generateCurrentMonth();
                        generateCurrentWeek();

                        //generate days after previous month end
                        if($scope.splittedCalendar[currentDayYear][currentDayMonth - 1]){
                            generateNextMonthDays();
                        }

                        generatePreviousMonthDays();
                    }
                }
                else{
                    $scope.splittedCalendar[currentDayYear] = [];

                    generateCurrentMonth();
                    generateCurrentWeek();

                    //generate days after previous year end
                    if($scope.splittedCalendar[currentDayYear - 1]){
                        generateNextMonthDays();
                    }

                    generatePreviousMonthDays();
                }
            }

            function initWatchers() {
                $scope.$watch('calendar', function(newValue, oldValue) {
                    if(oldValue && oldValue != newValue){
                        var existedDayIndex,
                            changedDay = _.filter(newValue, function(newValueDate) {
                                return _.filter(oldValue, function(oldValueDate) {
                                        return oldValueDate.date == newValueDate.date && JSON.stringify(oldValueDate) != JSON.stringify(newValueDate)
                                    }
                                )[0];
                            })[0];

                        $scope.company.defaultValues = $scope.company.defaultValues || [];

                        $scope.company.defaultValues.forEach(function(defaultDay, index) {
                            if(changedDay && defaultDay.date == changedDay.date){
                                existedDayIndex = index;
                            }
                        });

                        if(existedDayIndex >= 0 && changedDay.dayId){
                            $scope.company.defaultValues[existedDayIndex].dayId = changedDay.dayId;
                        }
                        else if(existedDayIndex >= 0 && !changedDay.dayId){
                            $scope.company.defaultValues.splice(existedDayIndex, 1);
                        }
                        else if(changedDay){
                            $scope.company.defaultValues.push({date: changedDay.date, dayId: changedDay.dayId});
                        }

                        calendarService.saveCompany($scope.company).success(function() {
                            Notification.success('Changes saved');
                        });
                    }
                }, true);
            }

            //var daysYear = $scope.calendar;

            function resetPeriodsSplitters(){
                $scope.calendar.forEach(function (day) {
                    if (day.date) {
                        day.isPeriodStartDate = false;
                        day.isPeriodEndDate = false;
                    }
                });
            }

            $scope.introSteps = [
                {
                    element: '#step1',
                    intro: "<p>In this section you could see the list of months." +
                    "Each day contain the date and the default workload of this day.</p>" +
                    "<p>By default all weekend days are colored with light blue color.</p>" +
                    "<p>You can change the workload and color of each day by clicking on this day and choosing from the collection of Day Types.</p>" +
                    "<p>You can create and edit the periods of Company. All periods splitters are marked on Calendar with blue vertical lines. " +
                    "Clicking on period splitter will remove it and merge two periods between it. Click on border of any two days will create the period " +
                    "splitter and split the current period in two.</p>",
                    position: 'right'
                },
                {
                    element: '#step3',
                    intro: "<p>Use Day Types controls to manage new Day Types. </p>" +
                    "<p>Press the Plus hexagon to add a new Day Type. </p>" +
                    "<p>Click on existed Day Type Name will change it\'s name. </p>" +
                    "<p>Click on workload will change the workload of current Day Type. </p>" +
                    "<p>Click inside existed Day Type Hexagon will allow you to select the color for edited Day Type." +
                    "Changing the Color of Day Type will change all days of this type in Calendar and all Timesheet days for chosen Day Type in calendar. </p>",
                    position: 'left'
                }
            ];

            $scope.splitCalendar = function(shouldBeSplitted, period, splitStartDate) {
                if(period == 'month' && splitStartDate.getDate() > 28){
                    alert('Please choose the correct date for split');
                    return;
                }

                switch(period){
                    case 'Week':
                        var startWeekDay = splitStartDate.getDay(),
                            endWeekDay = startWeekDay == 0 ? 6 : startWeekDay - 1;

                        $scope.calendar.forEach(function(day) {
                            if(day.date){
                                var currentDateWeekDay = new Date(day.date).getDay();

                                if(day.date && moment(new Date(day.date)) >= moment(new Date(splitStartDate))){
                                    if(currentDateWeekDay == startWeekDay){
                                        day.isPeriodStartDate = shouldBeSplitted;
                                    }
                                    else if(currentDateWeekDay == endWeekDay){
                                        day.isPeriodEndDate = shouldBeSplitted;
                                    }
                                }
                            }
                        });
                        break;

                    case 'Month':
                        var startDateDay = splitStartDate.getDate();

                        $scope.calendar.forEach(function(day) {
                            var currentDateDay,
                                endDateDay;

                            if(day.date && moment(new Date(day.date)) >= moment(new Date(splitStartDate))){
                                currentDateDay = new Date(day.date).getDate();
                                endDateDay = startDateDay - 1 || new Date(moment(new Date(day.date)).endOf('month').format('MMMM YYYY')).getDate();

                                if(currentDateDay == startDateDay){
                                    day.isPeriodStartDate = shouldBeSplitted;
                                }
                                else if(currentDateDay == endDateDay){
                                    day.isPeriodEndDate = shouldBeSplitted;
                                }
                            }
                        });
                        break;
                }

                $scope.calendar[$scope.calendar.length - 1].isPeriodEndDate = true;
                $scope.aggregatePeriods($scope.calendar);
            };

            //used by tableCell directive
            $scope.aggregatePeriods = function(calendar) {
                var periodSplitters = [],
                    periods = [];

                calendar.forEach(function(day) {
                    if(day.isPeriodStartDate){
                        periodSplitters.push({'start': day.date});
                    }

                    if(day.isPeriodEndDate){
                        periodSplitters.push({'end': day.date});
                    }
                });

                periods = _.groupBy(periodSplitters, function(element, index) {
                    return Math.floor(index / 2);
                });

                periods = _.toArray(periods);
                _.map(periods, function(period, index) {
                    periods[index] = angular.extend(period[0], period[1])
                });

                $scope.company.periods = periods;
            };

            $scope.openCalendar = function() {
                $scope.calendarIsOpened = true;
            };

            $scope.getMonthName = function(month) {
                //get last day of first week
                for(var i in month){
                    return moment(new Date(month[i][month[i].length - 1].date)).format('MMMM YYYY');
                }
            };

            $scope.chooseDayType = function(day, dayType) {
                if(dayType){
                    var customDay = _.find($scope.company.dayTypes, {id: dayType.id});

                    day.dayId = customDay.id;
                    day.color = customDay.color;
                    day.time = customDay.time;
                    day.comment = customDay.name;
                }
                else{
                    delete day.dayId;
                    delete day.color;
                    day.comment = '';
                    day.time = 8;
                }
            };

            $scope.saveDayType = function(changedDayType, changedDayTypeOldValue) {
                applyDefaultValues();

                calendarService.saveCompany($scope.company).success(function(data) {
                    $scope.company.dayTypes = data.dayTypes;
                });
            };

            $scope.calculatePeriods = function() {
                var firstPeriod = new Date(),
                    newPeriodStartDays = moment(new Date(firstPeriod)).add(1, 'days'),
                    newPeriodStartMonths = moment(new Date(firstPeriod)).add(1, 'months');

                $scope.company.periods = [];
                resetPeriodsSplitters();
                generatePeriods(newPeriodStartDays, newPeriodStartMonths);
                updateCalendarDaysWithPeriods();

                preferences.set('currentPeriodIndex', 0);
            };

            $scope.GenerateMoreDays = function() {

                var lastPeriodEnd = $scope.company.periods[$scope.company.periods.length - 1].end,
                    newPeriodStartDays = moment(new Date(lastPeriodEnd)).add(1, 'days'),
                    newPeriodStartMonths = moment(new Date(lastPeriodEnd)).add(1, 'months');

                generatePeriods(newPeriodStartDays, newPeriodStartMonths);
                generateCalendar();
            };

            function generatePeriods(newPeriodStartDays, newPeriodStartMonths) {
                var nextPeriodStart,
                    countPeriods,
                    daysInYear = 365,
                    monthsInYear = 12,
                    i;

                if($scope.periodSetting == "Week") {
                    countPeriods = daysInYear  / 7 / $scope.countPeriodSetting;
                    for (i = 0; i < countPeriods; i++) {
                        nextPeriodStart = moment(new Date(newPeriodStartDays)).add($scope.countPeriodSetting * i * 7, 'days');

                        $scope.company.periods.push({
                            start: nextPeriodStart.format('MM/DD/YYYY'),
                            end: nextPeriodStart.add(($scope.countPeriodSetting * 7) - 1, 'days').format('MM/DD/YYYY')
                        });
                    }
                }
                else{
                    countPeriods = monthsInYear / $scope.countPeriodSetting;
                    for(i = 0; i < countPeriods; i++){
                        nextPeriodStart = moment(new Date(newPeriodStartMonths)).add($scope.countPeriodSetting * i, 'months');

                        $scope.company.periods.push({
                            start: nextPeriodStart.format('MM/DD/YYYY'),
                            end: nextPeriodStart.add($scope.countPeriodSetting, 'months').format('MM/DD/YYYY')
                        });
                    }
                }
                $scope.company.countPeriodSetting = $scope.countPeriodSetting;
                $scope.company.periodSetting = $scope.periodSetting;
            }

            $scope.getDayColor = function(dayId) {
                if(dayId){
                    var dayType = _.findWhere($scope.company.dayTypes, {id: dayId});

                    if(dayType){
                        return dayType.color;
                    }
                }
            };

            $scope.changePeriodSplit = function(period) {
                $scope.selectedPeriod = period;
            };

            $scope.removeCustomDayTemplate = function(customDay) {
                var customDayIndex = _.findIndex($scope.company.dayTypes, customDay);

                $scope.company.dayTypes.splice(customDayIndex, 1);

                //remove assigned dayTypes
                $scope.company.defaultValues.forEach(function(defaultValue, index) {
                    if(defaultValue.dayId == customDay.id){
                        $scope.company.defaultValues.splice(index, 1)
                    }
                });

                //revert to default values
                $scope.calendar.map(function(day) {
                    if(day.dayId == customDay.id){
                        day.time = 8;
                        delete day.dayId;
                    }
                    return day
                });

                calendarService.saveCompany($scope.company);
            };
        }]);
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

angular.module('mifortTimesheet.calendar').factory('calendarService',
    ['$http', function($http) {
        return {
            getCompany: function(companyId) {
                return $http.get('api/v1/company/' + companyId);
            },
            saveCompany: function(parameters) {
                return $http.post('api/v1/company', parameters);
            },
            getPeriodSettings: function() {
                return [
                    'Week',
                    'Month'
                ]
            },
            getCountPeriodSettings: function() {
                return [
                    {count: 1},
                    {count: 2},
                    {count: 3},
                    {count: 4},
                    {count: 5}
                ]
            },
            getCountPeriodSettings1: function() {
                return [
                    {count: 1},
                    {count: 2},
                    {count: 3},
                    {count: 4},
                    {count: 5}
                ]
            },
            getWeekDays: function() {
                return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            }
        };
    }
    ]);

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

angular.module('mifortTimesheet.report', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/report', {
            templateUrl: 'report/reportView.html',
            controller: 'reportController'
        });
    }])

    .controller('reportController', ['$scope', 'reportService', 'preferences', 'uiGridConstants', 'topPanelService', '$timeout', '$location',
        function($scope, reportService, preferences, uiGridConstants, topPanelService, $timeout, $location) {
            var companyId = preferences.get('user').companyId,
                userRole = preferences.get('user').role.toLowerCase(),
                headerHeight = 38,
                maxVisiblePages = 5,
                columns = reportService.columns;

            $scope.introSteps = reportService.introSteps;

            if(userRole == 'owner' || userRole == 'manager'){
                $scope.userIsManager = true;
            }
            else{
                $scope.userIsManager = false;
            }

            $scope.getAggregatedComments = function(comments) {
                if(comments && comments.length){
                    //remove empty comments
                    var cleanComments = comments.filter(function(e) {
                        return e ? e.replace(/(\r\n|\n|\r)/gm, "") : ""
                    });

                    return cleanComments.join(", ")
                }
            };

            $scope.ranges = {
                'Today': [moment(), moment()],
                //'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 days': [moment().subtract(7, 'days'), moment()],
                'Last 30 days': [moment().subtract(30, 'days'), moment()],
                'This month': [moment().startOf('month'), moment().endOf('month')]
            };

            //default settings, field: "date" value must match the dateRangePicker default value
            $scope.reportSettings = {
                companyId: companyId,
                sort: {
                    field: 'date',
                    asc: false
                },
                filters: [],
                pageSize: 10,
                page: 1
            };

            if(!$scope.userIsManager){
                $scope.reportSettings.filters.push({
                    field: "userName",
                    value: [preferences.get('user').displayName]
                });
            }

            $scope.reports = [
                {
                    title: 'Log',
                    active: true,
                    setSettings: function() {
                        $scope.reportSettings.groupBy = [];
                        $scope.reportSettings.isCommentNeeded = false;
                    },
                    columnsOrder: ['date', 'userName', 'projectName', 'time', 'comment']
                },
                {
                    title: 'Project',
                    active: false,
                    setSettings: function() {
                        $scope.reportSettings.groupBy = ['projectName'];
                        $scope.reportSettings.isCommentNeeded = false;
                    },
                    columnsOrder: ['projectName', 'time']
                },
                {
                    title: 'Employee',
                    active: false,
                    setSettings: function() {
                        $scope.reportSettings.groupBy = ['userName'];
                        $scope.reportSettings.isCommentNeeded = true;
                    },
                    columnsOrder: ['userName', 'time', 'comments']
                },
                {
                    title: 'Project & Employee',
                    active: false,
                    setSettings: function() {
                        $scope.reportSettings.groupBy = ['userName', 'projectName'];
                        $scope.reportSettings.isCommentNeeded = true;
                    },
                    columnsOrder: ['projectName', 'userName', 'time', 'comments']
                }
            ];

            $scope.changeActiveReport = function(activeIndex) {
                $scope.reportSettings.page = 1;

                $scope.reports.map(function(report) {
                    report.active = false;

                    return report;
                });

                $scope.reports[activeIndex].active = true;
                $scope.reports[activeIndex].setSettings();
                $scope.getReport();
            };

            $scope.reportColumns = ['Data', 'User', 'Project', 'Assignment', 'Time', 'Action'];
            $scope.perPage = [10, 20, 50, 100];
            $scope.totalCount = 0;
            $scope.projects = [];

            $scope.timesheetGridOptions = {
                ranges: $scope.ranges,
                paginationPageSizes: [25, 50, 75],
                paginationPageSize: 25,
                enableFiltering: true,
                enableHorizontalScrollbar: 0,
                enableVerticalScrollbar: uiGridConstants.scrollbars.NEVER,
                rowHeight: 30,
                columnDefs: [],
                data: 'reportData',
                reportFilters: [],

                onRegisterApi: function(gridApi) {
                    $scope.gridApi = gridApi;
                    $scope.gridApi.core.on.sortChanged($scope, $scope.sortChanged);
                    $scope.getReport();
                }
            };

            $scope.sortChanged = function(grid, sortColumns) {
                $scope.reportSettings.page = 1;

                if(sortColumns.length === 0 || (sortColumns[0] && !sortColumns[0].sort)){
                    $scope.reportSettings.sort = {
                        field: 'date',
                        asc: false
                    };

                    $scope.getReport();
                }else{
                    switch(sortColumns[0].sort.direction){
                        case uiGridConstants.ASC:
                            $scope.reportSettings.sort = {
                                field: sortColumns[0].field,
                                asc: true
                            };
                            break;

                        case uiGridConstants.DESC:
                            $scope.reportSettings.sort = {
                                field: sortColumns[0].field,
                                asc: false
                            };
                            break;
                        default:
                            $scope.reportSettings.sort = {};
                    }

                    $scope.getReport();
                }
            };

            reportService.getFilters(companyId).success(function(data) {
                $scope.timesheetGridOptions.reportFilters = $scope.timesheetGridOptions.reportFilters.concat(data);
            });

            $scope.$watch('timesheetGridOptions.reportFilters', function(newValue, oldValue) {
                if(oldValue && newValue && newValue != oldValue){
                    //$scope.reportSettings.filters = [];
                    var dateFilter = _.where(newValue, {field: 'date'})[0],
                        usedFilters = $scope.reportSettings.filters,
                        dateFilterIndex = _.findIndex(usedFilters, {field: 'date'});

                    if(dateFilter && dateFilterIndex != -1){
                        usedFilters[dateFilterIndex] = dateFilter;
                    }
                    else if(dateFilter){
                        usedFilters.push(dateFilter)
                    }

                    newValue.forEach(function(filter) {
                        var filterToPush = {
                            field: filter.field
                        };

                        //proper names for backend
                        switch(filterToPush.field){
                            case 'projects':
                                filterToPush.field = 'projectName';
                                break;
                            case 'users':
                                filterToPush.field = 'userId';
                                break;
                        }

                        var checkedFilters = _.where(filter.value, {isChecked: true}),
                            usedFilterIndex = _.findIndex(usedFilters, {field: filterToPush.field});

                        filterToPush.value = checkedFilters.map(function(checkedFilter) {
                            return checkedFilter.name._id || checkedFilter.name;
                        });


                        if(filterToPush.value.length && usedFilterIndex == -1){
                            usedFilters.push(filterToPush);
                        }
                        else if(filterToPush.value.length && usedFilterIndex !== -1){
                            usedFilters[usedFilterIndex] = filterToPush;
                        }
                        else if(usedFilterIndex !== -1 && filterToPush.field != 'date'){
                            usedFilters.splice(usedFilterIndex, 1);
                        }
                    });

                    $scope.getReport();
                }
            }, true);

            $scope.getReport = function() {
                var dateFilterIndex = _.findIndex($scope.reportSettings.filters, function(reportFilter) {
                    return reportFilter.field == 'date';
                });

                if(dateFilterIndex >= 0){
                    reportService.getReport($scope.reportSettings).success(function(data, status, headers) {
                        var columnsOrder = $scope.reports[_.findIndex($scope.reports, {active: true})].columnsOrder;

                        $scope.reportData = data;

                        //add columns to grid
                        if(data.length){
                            $scope.timesheetGridOptions.columnDefs = [];
                            $scope.timesheetGridOptions.columnDefs.length = columnsOrder.length;

                            for(var column in data[0]){
                                if(columns[column]){
                                    var indexToPush = _.indexOf(columnsOrder, column);

                                    $scope.timesheetGridOptions.columnDefs[indexToPush] = columns[column];
                                }
                            }
                        }

                        $scope.gridHeight = {
                            height: ((data.length) * ($scope.timesheetGridOptions.rowHeight + 1)) + headerHeight + "px"
                        };

                        if(headers()['x-total-count']){
                            $scope.totalCount = headers()['x-total-count'];
                            $scope.totalPages = Math.ceil($scope.totalCount / $scope.reportSettings.pageSize);
                        }
                    }).finally(function() {
                        //call the directive 'cuttedComment' to reRender comments
                        $timeout(function() {
                            $scope.$broadcast('activeReportChanged');
                        });
                    });
                }
            };

            $scope.openPage = function(pageIndex) {
                $scope.reportSettings.page = pageIndex;
                $scope.getReport();
            };

            $scope.nextPage = function() {
                if($scope.reportSettings.page < $scope.totalPages){
                    $scope.reportSettings.page++;
                    $scope.getReport();
                }
            };

            $scope.prevPage = function() {
                if($scope.reportSettings.page > 1){
                    $scope.reportSettings.page--;
                    $scope.getReport();
                }
            };

            $scope.range = function(n) {
                return new Array(n);
            };

            $scope.downloadCsv = function() {
                if($scope.reportSettings.groupBy && $scope.reportSettings.groupBy.length){
                    reportService.downloadAggregationCsv($scope.reportSettings).success(function(data) {
                        window.location = data.url;
                    });
                }
                else{
                    reportService.downloadCsv($scope.reportSettings).success(function(data) {
                        window.location = data.url;
                    });
                }
            };

            $scope.perPageChanged = function(perPage) {
                $scope.reportSettings.pageSize = perPage;
                $scope.reportSettings.page = 1;
                $scope.getReport();
            };

            $scope.$on('handleBroadcast', function() {
                if(topPanelService.linkName = 'report'){
                    $scope.downloadCsv();
                }
            });

            $scope.showOriginalPage = function(pageNumber) {
                if($scope.reportSettings.page + 2 >= pageNumber &&
                    $scope.reportSettings.page - 2 <= pageNumber){
                    return true;
                }
                else if(($scope.reportSettings.page < 3 && pageNumber <= maxVisiblePages) ||
                    ($scope.reportSettings.page + 1 >= $scope.totalPages && pageNumber + 4 >= $scope.totalPages)){
                    return true;
                }
            };

            $scope.showFirstPage = function() {
                if($scope.totalPages > maxVisiblePages &&
                    ($scope.reportSettings.page > 4 || $scope.reportSettings.page - 3 > 0)){
                    return true;
                }
            };

            $scope.showFirstDots = function() {
                if($scope.totalPages > maxVisiblePages &&
                    ($scope.reportSettings.page > 4)){
                    return true;
                }
            };

            $scope.showLastPage = function() {
                if($scope.totalPages > maxVisiblePages && $scope.reportSettings.page + 3 <= $scope.totalPages){
                    return true;
                }
            };

            $scope.showLastDots = function() {
                if($scope.reportSettings.page + 4 <= $scope.totalPages){
                    return true;
                }
            };

            $scope.editEmployeeTimesheet = function(userName) {
                var usersFilter = _.findWhere($scope.timesheetGridOptions.reportFilters, {field: 'users'}),
                    user = _.find(usersFilter.value, function(filterValue) {
                        return filterValue.name.displayName == userName;
                    });

                $location.path('timesheet/' + user.name._id);
            }
        }]);
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

angular.module('mifortTimesheet.report').factory('reportService',
    ['$http', function($http) {
        return {
            getFilters: function(companyId) {
                return $http.get('api/v1/report/filters/' + companyId);
            },
            getReport: function(reportSettings) {
                if(reportSettings.groupBy && reportSettings.groupBy.length){
                    return $http.post('api/v1/report/aggregation', reportSettings);
                }
                else{
                    return $http.post('api/v1/report/common', reportSettings);
                }
            },
            downloadCsv: function(reportSettings) {
                return $http.post('api/v1/report/common/download', reportSettings);
            },
            downloadAggregationCsv: function(reportSettings) {
                return $http.post('api/v1/report/aggregation/download', reportSettings);
            },
            columns: {
                date: {
                    field: 'date',
                    minWidth: 168,
                    width: 168,
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    enableFiltering: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span report-date-picker id="step2" class="report-filter"></span></div>'
                },
                userName: {
                    field: 'userName',
                    displayName: 'Employee Name',
                    minWidth: 172,
                    width: 172,
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div ng-if="$parent.grid.appScope.userIsManager" class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="users" col-title="Employee Name"></span></div>',
                    cellTemplate: '<div class="ui-grid-cell-contents">' +
                    '<a href="" ng-if="$parent.grid.appScope.userIsManager" ng-click="$parent.grid.appScope.editEmployeeTimesheet(row.entity.userName)">{{row.entity.userName}}</a>' +
                    '<span ng-if="!$parent.grid.appScope.userIsManager">{{row.entity.userName}}</span>' +
                    '</div>'
                },
                projectName: {
                    field: 'projectName',
                    minWidth: 152,
                    width: 152,
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="projects" col-title="Project Name"></span></div>'
                },
                time: {
                    field: 'time',
                    width: 82,
                    minWidth: 82,
                    textAlign: 'right',
                    paddingRight:0,
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    enableFiltering: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Time"></span></div>',
                    cellTemplate:'<div class="report-time-cell">{{row.entity[col.field]}}</div>'
                },
                comment: {
                    field: 'comment',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    enableSorting: false,
                    enableFiltering: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Comment"></span></div>',
                    cellTemplate: '<span cutted-comment></span>'
                },
                comments: {
                    field: 'comments',
                    enableColumnResizing: true,
                    enableColumnMenu: false,
                    enableSorting: false,
                    enableFiltering: false,
                    filterHeaderTemplate: '<div class="ui-grid-filter-container"><span dropdown-filter class="dropdown-filter" col-name="time" col-title="Comments"></span></div>',
                    cellTemplate: '<span cutted-comment></span>'
                }
            },
            introSteps: [
                {
                    element: '#step1',
                    intro: "<p>This is a table of all logs among the application. Each column could be sorted by clicking on column name " +
                    "and each of them has filter that could be opened on the filter button next to column name.</p>" +
                    "<p>User, Project and Assignment columns has dropdown filter with the quick search field and checkboxes to choose the filtered options.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step2',
                    intro: "<p>Switch tabs to change the column to be aggregated.</p>",
                    position: 'bottom'
                },
                {
                    element: '#step3',
                    intro: "<p>Use aggregation field to set the period of time to show.</p>",
                    position: 'bottom'
                },
                {
                    element: '#print',
                    intro: "<p>You could print or export the report by pressing the top panel buttons Print/CSV.</p>",
                    position: 'left'
                }
            ]
        }
    }
    ]);
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

angular.module('mifortTimesheet.employees', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/employees', {
            templateUrl: 'employees/employeesView.html',
            controller: 'employeesController'
        });
    }])

    .controller('employeesController', ['$scope', 'employeesService', 'preferences', '$location',
        function($scope, employeesService, preferences, $location) {
            var companyId = preferences.get('user').companyId;

            $scope.path = $location.path();

            employeesService.getCompanyEmployers(companyId).success(function(employees) {
                employees.forEach(function(employee) {
                    if(employee.external && employee.external.photos.length){
                        employee.photo = employee.external.photos[0].value.split("?")[0] + '?sz=132';
                    }

                    employee.isCollapsed = true;
                });

                $scope.employees = employees;
            });

            $scope.getInitials = function(name) {
                var initials = name.match(/\b\w/g);
                initials = (initials.shift() + initials.pop()).toUpperCase();
                 return initials;
            };

            $scope.calculateWorkload = function(employee) {
                var totalWorkload = 0;

                if(employee.assignments){
                    employee.assignments.forEach(function(assignment) {
                        totalWorkload += +assignment.workload;
                    });
                }

                return totalWorkload;
            };

            $scope.searchEmployees = function(employeeSearch) {
                //delete fields from filter so angular will use it's native search correctly(so it won't leave the empty search properties)
                for(var field in employeeSearch){
                    if(!employeeSearch[field].length
                        && (!angular.isObject(employeeSearch[field]) || employeeSearch[field].projectName === '' || employeeSearch[field].role === '')){
                        delete employeeSearch[field];
                    }
                }

                $scope.activeSearch = angular.copy(employeeSearch);
            };

            $scope.clearSearch = function() {
                $scope.employeeSearch = {};
                $scope.activeSearch = {};
            };

            $scope.hasArchivedProjects = function(assignments) {
                return _.findWhere(assignments, {archived: true});
            }
        }]);
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

angular.module('mifortTimesheet.employees').factory('employeesService',
    ['$http', function($http) {
        return {
            getCompanyEmployers: function(companyId) {
                return $http.get('api/v1/user/company/' + companyId);
            }
        }
    }
    ]);
