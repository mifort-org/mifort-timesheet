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
var companies = require('../company');
var projects = require('../project');
var dbSettings = require('./mongodb_settings');
var log = require('./logger');

var company = {
    "name": "Mifort",
    "description": "Bla bla",
    "template": {
        "date": "",
        "role": "",
        "time": 4,
        "comment": ""
    },
    "periods" : [
        {
            "start": new Date("01/01/2015"),
            "end": new Date("02/01/2015")
        },
        {
            "start": new Date("02/01/2015"),
            "end": new Date("03/01/2015")
        },
        {
            "start": new Date("03/01/2015"),
            "end": new Date("04/01/2015")
        },
        {
            "start": new Date("04/01/2015"),
            "end": new Date("05/01/2015")
        },
        {
            "start": new Date("05/01/2015"),
            "end": new Date("06/01/2015")
        },
        {
            "start": new Date("06/01/2015"),
            "end": new Date("07/01/2015")
        },
        {
            "start": new Date("07/01/2015"),
            "end": new Date("08/01/2015")
        },
        {
            "start": new Date("08/01/2015"),
            "end": new Date("09/01/2015")
        },
        {
            "start": new Date("10/01/2015"),
            "end": new Date("11/01/2015")
        },
        {
            "start": new Date("11/01/2015"),
            "end": new Date("12/01/2015")
        },
        {
            "start": new Date("12/01/2015"),
            "end": new Date("01/01/2016")
        }
    ]
};

var user = {
    "email": "a.d.trofimov@gmail.com",
    "workload": 8,
    "assignments" : [ 
        {
            "role": "Developer",
            "workload": 4,
            "projectName": "Super puper project"
        }
    ]
};

var project = {
    "name":"Super puper project",
    "description": "Bla bla bla",
    "active": true,
    "template": {
        "date": "",
        "role": "",
        "time": 4,
        "comment": ""
    },
    "periods" : [
        {
            "start": new Date("01/01/2015"),
            "end": new Date("02/01/2015")
        },
        {
            "start": new Date("02/01/2015"),
            "end": new Date("03/01/2015")
        },
        {
            "start": new Date("03/01/2015"),
            "end": new Date("04/01/2015")
        },
        {
            "start": new Date("04/01/2015"),
            "end": new Date("05/01/2015")
        },
        {
            "start": new Date("05/01/2015"),
            "end": new Date("06/01/2015")
        },
        {
            "start": new Date("06/01/2015"),
            "end": new Date("07/01/2015")
        },
        {
            "start": new Date("07/01/2015"),
            "end": new Date("08/01/2015")
        },
        {
            "start": new Date("08/01/2015"),
            "end": new Date("09/01/2015")
        },
        {
            "start": new Date("10/01/2015"),
            "end": new Date("11/01/2015")
        },
        {
            "start": new Date("11/01/2015"),
            "end": new Date("12/01/2015")
        },
        {
            "start": new Date("12/01/2015"),
            "end": new Date("01/01/2016")
        }
    ]
};

exports.import = function() {
    var companyCollection = dbSettings.companyCollection();
    companyCollection.count(function (err, count) {
        if (!err && count === 0) {
            companies.save(company, function(err, savedCompany){
                project.companyId = savedCompany._id;
                user.companyId = savedCompany._id;
                projects.saveInDb(project, function(err, savedProject){
                    user.assignments[0].projectId = savedProject._id;
                    users.save(user, function(err, savedUser){
                        log.info('Test data is imported! Company ID: %s', savedCompany._id);
                    });
                });
            });
        }
    })
   
};