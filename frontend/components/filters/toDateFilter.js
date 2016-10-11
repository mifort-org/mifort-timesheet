
angular.module('mifortTimesheet')
    .filter("toDateFilter", function () {
        return function (input) {
            return new Date(input);
        }
    });