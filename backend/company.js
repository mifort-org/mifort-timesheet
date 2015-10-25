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

var moment = require('moment');

var dbSettings = require('./libs/mongodb_settings');
var users = require('./user');
var utils = require('./libs/utils');
var registration = require('./libs/registration');
var log = require('./libs/logger');

//Rest API
exports.restFindById = function(req, res, next) {
    var companyId = utils.getCompanyId(req);
    log.debug('-REST call: Find company by id. Company id: %s', companyId.toHexString());

    findById(companyId, function(err, company, next) {
        if(err) {
            err.code = 400;
            next(err);
        } else {
            res.json(company);
            log.debug('-REST result: Finded company id. Company id: %s', 
                company._id.toHexString());
        }
    });
};

exports.restCreateCompany = function(req, res, next) {
    var company = req.body;
    log.debug('-REST call: Create company. Company name: %s', company.name);

    var defaultCompany = exports.generateDefaultCompany();
    company.template = defaultCompany.template;
    company.periods = defaultCompany.periods;
    company.dayTypes = defaultCompany.dayTypes;
    if(req.user) {
        company.ownerId = req.user._id;
    }

    save(company, function(err, savedCompany) {
        if(err) {
            next(err);      
        } else {
            //Warning: asynchronous operations!!! 
            registration.createDefaultProject(savedCompany, req.user); //Validation: check user!!!
            createUsersByEmails(savedCompany);
            res.json(savedCompany);
            log.debug('-REST result: Create company. Company id: %s', 
                savedCompany._id.toHexString());
        }
    });
};

exports.restUpdateCompany = function(req, res, next) {
    var company = req.body;
    log.debug('-REST call: Update company. Company id: %s', company._id.toHexString());
    save(company, function(err, savedCompany) {
        if(err) {
            next(err);        
        } else {
            //update all projects
            var projects = dbSettings.projectCollection();
            projects.update(
                    {companyId: savedCompany._id},
                    {$set: {template: savedCompany.template,
                            periods: savedCompany.periods,
                            defaultValues: savedCompany.defaultValues,
                            dayTypes: savedCompany.dayTypes}},
                    {multi:true}, 
                function(err, result){
                    log.info('Company projects are updated!')
                });
            createUsersByEmails(savedCompany);
            res.json(savedCompany);
            log.debug('-REST result: Update company. Company id: %s', 
                savedCompany._id.toHexString());
        }
    });
};

//Public API
exports.save = save;

exports.generateDefaultCompany = function() {
    var periods = [];
    
    var firstPeriod = {
        start: moment.utc().toDate(),
        end: moment.utc().endOf('week').toDate()
    };
    periods.push(firstPeriod);
    
    //generate 53 weeks (1 year)
    var startDate = moment.utc(firstPeriod.end).add(1,'day').toDate();
    var endDate = moment.utc(startDate).endOf('week').toDate();
    for (var i = 0; i < 53; i++) {
        periods.push({
            start: startDate,
            end: endDate
        });
        startDate = moment.utc(endDate).add(1,'day').toDate();
        endDate = moment.utc(startDate).endOf('week').toDate();
    };

    var company = {
        template : {
            date: '',
            role: '',
            time: 8,
            comment: ''
        },
        periods: periods,
        dayTypes: [
            {
                name: 'Weekend',
                time: 0,
                color: '#c5e9fb'
            },
            {
                name: 'Corporate',
                time: 0,
                color: '#f3cce1'
            },
            {
                name: 'Holiday',
                time: 0,
                color: '#fff9a1'
            }
        ]
    }

    return company;
};

exports.findById = findById;

//private part
function findById(id, callback) {
    var companies = dbSettings.companyCollection();
    companies.findOne({_id: id}, function(err, company){
        callback(err, company);
    });
}

function createUsersByEmails(company) {
    var emails = company.emails;
    if(emails) {
        emails.forEach(function(email) {
            var user = {email: email,
                        companyId: company._id};

            users.findByExample(user, function(err, dbUser) {
                if(err) {
                    log.error('Cannot find user by email for new company.', {error: err});
                } else if(!dbUser) {
                    user.displayName = email;
                    users.save(user, function(err, savedUser) {
                        if(err) {
                            log.error('Cannot saved user by email for new company.', {error: err});
                        } else {
                            log.info('User saved with e-mail %s', savedUser.email);
                        }
                    });
                }
            });
            
        })
    }
}

function save(company, callback) {
    var companies = dbSettings.companyCollection();
    companies.save(company, {safe:true}, function (err, result) {
        if(result.ops) {
            callback(err, result.ops[0]);
        } else {
            callback(err, company);
        }
    });
};
