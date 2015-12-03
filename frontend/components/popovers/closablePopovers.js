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

angular.module('mifortTimelog')
    .directive('closablePopovers', function () {
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