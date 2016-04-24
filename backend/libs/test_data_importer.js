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
 *
 * @author Andrew Voitov
 */

var users = require('../user');
var companies = require('../company');
var projects = require('../project');
var db = require('./mongodb_settings');
var log = require('./logger');

var user = {
    email: "test@test.com",
    displayName: "Test User",
    role: "Owner",
    workload: 8,
    assignments : [
        {
            role: "Developer",
            workload: 4,
            userName: "Test User"
        }
    ]
};

exports.import = function() {
    var companyCollection = db.companyCollection();
    companyCollection.count(function (err, count) {
        if (!err && count === 0) {
            var company = createTestCompany();
            companies.save(company, function(err, savedCompany){
                var project = projects.generateDefaultProject(savedCompany);
                projects.saveInDb(project, function(err, savedProject){
                    user.assignments[0].projectId = savedProject._id;
                    user.assignments[0].projectName = savedProject.name;
                    user.companyId = savedCompany._id;
                    users.save(user, function(err, savedUser){
                        log.info('Test data is imported! Company ID: %s',
                            savedCompany._id.toHexString());
                    });
                });
            });
        }
    })
};

function createTestCompany() {
    var company = {
        "name": "Mifort-Test",
        "description": "Bla bla",
    };

    var newCompany = companies.generateDefaultCompany();
    newCompany.name = company.name;
    newCompany.description = company.description;

    return newCompany;
}
