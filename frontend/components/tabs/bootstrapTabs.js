'use strict';

angular.module('myApp')
    .directive('bootstrapTabs', function($location) {
        return {
            link: function (scope) {
                scope.tabs = [
                    {title: 'timesheetManagement'},
                    {title: 'timelog'},
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