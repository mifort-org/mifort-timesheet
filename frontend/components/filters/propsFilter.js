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


angular.module('mifortTimelog').filter('propsFilter', function() {
    return function(items, props) {
        var out = [];

        if(angular.isArray(items)){
            items.forEach(function(item) {
                var itemMatches = false;

                var keys = Object.keys(props);
                for(var i = 0; i < keys.length; i++){
                    var prop = keys[i];
                    var text = props[prop].toLowerCase();
                    if(item[prop].toString().toLowerCase().indexOf(text) !== -1){
                        itemMatches = true;
                        break;
                    }
                }

                if(itemMatches){
                    out.push(item);
                }
            });
        }else{
            out = items;
        }

        return out;
    }
});