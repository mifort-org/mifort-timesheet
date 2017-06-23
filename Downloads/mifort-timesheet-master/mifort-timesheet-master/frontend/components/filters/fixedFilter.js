
angular.module('mifortTimesheet')
    .filter('fixedFilter', function(){

    return function(n){
        if (n.toFixed() != n) {
            return n.toFixed(2);
        }
        return n;
    };
});
