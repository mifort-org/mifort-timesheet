'use strict';

angular.module('myApp')
    .directive('projectRow', function ($location) {
        return {
            scope: true,
            link: function (scope, element) {

            },
            templateUrl: 'components/projectRow/projectRow.html'
        };
    });