angular.module('myApp').filter('getByProperty', function() {
    return function(input, id, property) {
        var i=0, len=input.length;
        for (i; i<len; i++) {
            if (+input[i][property] == +id) {
                return input[i];
            }
        }
        return null;
    }
});