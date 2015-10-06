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

var users = require('../user');
var projects = require('../project');

exports.createUser = function(user, callback) {
    users.save(user, function(err, savedUser){
        if(err) {
            callback(err, savedUser);
        } else {
            callback(null, savedUser);
        }
    });
};

exports.createDefaultProject = function(company, user) {
    var project = projects.generateDefaultProject(company);
    projects.saveInDb(project, function(err, savedProject) {
        console.log('Defaul project is created!');
        if(err) {
            console.log('Cannot save project!'); 
        } else {
            if(user) {
                user.assignments = [{
                    userId: user._id,
                    role: 'Employee',
                    projectName: savedProject.name,
                    projectId: savedProject._id
                }];
                users.save(user, function(err, updatedUser) {
                    console.log('Default assignment is added!');
                });
            }
        }
    });
};