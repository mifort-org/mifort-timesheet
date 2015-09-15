'use strict';

angular.module('myApp')
    .directive('bootstrapTabs', function($location) {
        return {
            link: function (scope) {
                scope.tabs = [
                    {title: 'company'},
                    {title: 'timelog'},
                    {title: 'timesheetManagement'},
                    {title: 'projectReport'},
                    {title: 'projectManagement'},
                    {title: 'peopleReport'}
                ];

                scope.changeTab = function (tab) {
                    $location.path('/' + tab.title);
                };
            },
            templateUrl: 'components/tabs/bootstrapTabs.html'
        };
    });