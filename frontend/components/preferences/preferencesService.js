'use strict';

angular.module('preferences').factory('preferences', ['$q', function ($q) {

    return {
        set: function (key, value) {
            localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
        },

        get: function (key) {
            var data = localStorage.getItem(key);
            if (data && typeof data === 'string' && (data[0] === '[' || data[0] === '{')) {
                data = JSON.parse(data);
            }
            return data === 'true' || (data === 'false' ? false : data);
        },

        remove: function (key) {
            localStorage.removeItem(key);
        }
    };
}]);
