'use strict';

angular.module('myApp')
    .directive('bootstrapTabs', function($location) {
        return {
            link: function (scope) {
                scope.tabs = [
                    {title: 'projects'},
                    {title: 'timelog'},
                    {title: 'report'},
                    {title: 'timesheetManagement'},
                    {title: 'companyCreate'},
                    {title: 'companyEdit'}
                ];

                scope.changeTab = function (tab) {
                    $location.path('/' + tab.title);
                };
            },
            templateUrl: 'components/tabs/bootstrapTabs.html'
        };
    });