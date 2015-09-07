'use strict';

angular.module('myApp')
    .directive('tableCell', function () {
        return {
            scope: true,
            link: function () {
                angular.element(document).bind('click', function (e) {
                    var popups = document.querySelectorAll('.popover');
                    if(popups) {
                        for(var i=0; i<popups.length; i++) {
                            var popup = popups[i];
                            var popupElement = angular.element(popup);

                            if(!$(e.target).parents('.popover').length && popupElement[0].previousSibling != e.target){
                                popupElement.scope().$parent.isOpen=false;
                                popupElement.remove();
                            }
                        }
                    }
                });
            }
        };
    });