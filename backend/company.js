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

var moment = require('moment');

var db = require('./libs/mongodb_settings');
var users = require('./user');
var utils = require('./libs/utils');
var registration = require('./libs/registration');
var log = require('./libs/logger');
var constants = require('./libs/config_constants');
var mail = require('./libs/mail');
var u = require("underscore");
var backup = require('mongodb-backup');
var schedule = require('node-schedule');
var fs = require('fs');
var anyFile = require('any-file');
var zlib = require('zlib');

setTimeout(function() {log.info('Company')}, 1);
// initBackups ();
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
    company.defaultValues = defaultCompany.defaultValues;
    company.availablePositions = defaultCompany.availablePositions;
    var currentDate = new Date();
    company.createdOn = currentDate;
    company.updatedOn = currentDate;
    if(req.user) {
        company.ownerId = req.user._id;
    }
    save(company, function(err, savedCompany) {
        if(err) {
            next(err);
        } else {
            //Warning: asynchronous operations!!!
            registration.createDefaultProject(savedCompany, req.user);
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
    if(!company.availablePositions) {
        company.availablePositions = constants.DEFAULT_AVAILABLE_POSITIONS;
    }

    addIdToDayTypes(company);
    company.updatedOn = new Date();

    db.companyCollection().findOne({_id: company._id}, function (err, c) {
        var root = './dump';
        if(c.backupFrequency != company.backupFrequency) {
            setBackupSchedule(company._id, company.backupFrequency, root);
        }
    });
    save(company, function(err, savedCompany) {
        if(err) {
            next(err);
        } else {
            //update all projects
            var projects = db.projectCollection();
            projects.update(
                    {companyId: savedCompany._id},
                    {$set: {template: savedCompany.template,
                            periods: savedCompany.periods,
                            defaultValues: savedCompany.defaultValues,
                            dayTypes: savedCompany.dayTypes,
                            availablePositions: savedCompany.availablePositions}},
                    {multi: true},
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

exports.defaultPositions = constants.DEFAULT_AVAILABLE_POSITIONS.slice();

//dayTypes
var Weekend = {
    id: 1,
    name: 'Weekend',
    time: 0,
    color: '#c5e9fb'
};
var Corporate = {
    id: 2,
    name: 'Corporate',
    time: 0,
    color: '#f3cce1'
};
var Holiday = {
    id: 3,
    name: 'Holiday',
    time: 0,
    color: '#fff9a1'
};

exports.generateDefaultCompany = function() {
    var periods = generateDefaultPeriods();
    var defaultValues = generateDefaultValues(periods);

    var company = constructCompany(periods, defaultValues);
    return company;
};

exports.findById = findById;

exports.initBackups = function() {
    db.companyCollection().find({}).toArray(function (err, companies) {
        u.each(companies, function (company) {
            if(company.backupFrequency && company.backupFrequency != 'none') {
                log.info(company.backupFrequency);
                setBackupSchedule(company._id, company.backupFrequency);
            }
        })
    });
    log.info('Backups init!')
};

exports.companyBackup  = function (req, res, next) {
    var companyId = utils.getCompanyId(req);
    log.debug('-REST call: Find company by id. Company id: %s', companyId.toHexString());
    //companyDataToFile (companyId);
    companyDataUpload(companyId);
    res.json({lastBackupDate: new Date()});
};

var backupSchedule = {};

function setBackupSchedule (companyId, period, root) {
   db.companyCollection().findOne({_id: companyId}, function (err, doc) {
       var start;
       if (doc.lastBackupDate) {
           start = doc.lastBackupDate;
       } else {
           start = new Date;
       }
       log.info('start: ' + start);
       var weekDay = start.getDay();
       var day = start.getDate();
       var hour = start.getHours();
       log.info('day: ' + day);
       log.info('weekDay: ' + weekDay);
       log.info('hour: ' + hour);

       switch(period) {
           case 'none':
               clear();
               break;
           case 'month':
               //set('0'+ hour + day + ' * *');
               set('0 * * * * *');
               break;
           case 'week':
               //set('0'+ hour + '* *' + weekDay);
               set('30 * * * * *');
               break;
           default:
               log.error('backup period is wrong. Company id: %s',
                   savedCompany._id.toHexString());
       }
       function clear() {
           if (backupSchedule[companyId]) {
               backupSchedule[companyId].cancel();
           }
       }
       function set (time) {
           clear();
           log.debug('setSchedule: ' + time);
           backupSchedule[companyId] = schedule.scheduleJob(time, function(){
               companyDataUpload(companyId);
           });
       }
   });
};

//private part
function findById(id, callback) {
    var companies = db.companyCollection();
    companies.findOne({_id: id}, function(err, company){
        callback(err, company);
    });
}

function createUsersByEmails(company) {
    var emails = company.emails;
    if(emails) {
        emails.forEach(function(email) {
            var user = {email: email.toLowerCase(),
                        companyId: company._id};

            users.findByExample(user, function(err, dbUser) {
                if(err) {
                    log.warn('Cannot find user by email for new company.', {error: err});
                } else if(!dbUser) {
                    user.displayName = email;
                    user.role = constants.EMPLOYEE_ROLE;
                    users.save(user, function(err, savedUser) {
                        if(err) {
                            log.error('Cannot save user by email for new company.', {error: err});
                        } else {
                            log.info('User saved with e-mail %s', savedUser.email);
                            mail.sendInvite(email, company.name);
                        }
                    });
                }
            });

        })
    }
}

function addIdToDayTypes(company) {
    if(company.dayTypes) {
        var ids = company.dayTypes.map(function(dayType) {
            if(dayType.id) {
                return dayType.id;
            } else {
                return 0;
            }
        });
        var maxId = Math.max.apply(null, ids);
        company.dayTypes.forEach(function(dayType) {
            if(!dayType.id) {
                maxId = maxId + 1;
                dayType.id = maxId;
            }
        })
    }
}

function save(company, callback) {
    var companies = db.companyCollection();
    companies.save(company, {safe:true}, function (err, result) {
        if(result.ops) {
            callback(err, result.ops[0]);
        } else {
            callback(err, company);
        }
    });
}

function constructCompany(periods, defaultValues) {
    return {
        template : {
            date: '',
            role: '',
            time: 8,
            comment: ''
        },
        periods: periods,
        dayTypes: [
            Weekend, Corporate, Holiday
        ],
        defaultValues: defaultValues,
        availablePositions: constants.DEFAULT_AVAILABLE_POSITIONS
    };
}

function generateDefaultPeriods() {
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

    return periods;
}

function generateDefaultValues(periods) {
    var defaultValues = [];

    periods.forEach(function(period) {
        if(isWeekend(period.start)) {
            defaultValues.push({date: period.start, dayId: Weekend.id});
        }
        if(isWeekend(period.end)) {
            defaultValues.push({date: period.end, dayId: Weekend.id});
        }
    });

    return defaultValues;
}

function isWeekend(date) {
    return moment.utc(date).day() % 6 == 0;
}

function companyDataToFile (companyId, root) {
    var uri = 'mongodb://localhost:27017/homogen';
    var today = new Date;
    today = today.toISOString().match(/\d{4}-\d{2}-\d{2}/)[0];
    var fileName = today + '.txt';
    var file = root + '/' + fileName;

    fs.writeFile(file, '', function(err) {
        if(err) {
            return console.log(err);
        }

        collectData('company', {_id: companyId}, file, addDataToFile);
        collectData('project', {companyId: {$eq: companyId}}, file, addDataToFile);
        collectData('user', {companyId: {$eq: companyId}}, file, addDataToFile);
        getCompanyProjects(companyId, function(projects) {
            collectData('timelog', {projectId: {$in: projects}}, file, addDataToFile);
        });

        log.info('The file was saved!');
    });


    return fileName;
}

function getCompanyProjects(companyId, callback) {
    db.projectCollection().find({companyId: {$eq: companyId}}).toArray(function (err, logs) {
        if (err) {
            throw err;
        }

        var projects = [];
        u.each(logs, function (project) {
            log.debug(project._id);
            projects.push(project._id);
        });
        callback(projects);
    });
}

function addDataToFile (file, data, collection) {
    fs.appendFile(file, data, function (err) {
        if (err) {
            throw err;
        }
        log.info('The "' + collection + ' collection data" was appended to file!');
    });
}

function collectData(collectionName, query, file, callback) {
    var collection = collectionName + 'Collection';
    db[collection]().find(query).toArray(function(err, result) {
        if (err) {
            throw err;
        } else {
            var str = '{' + collectionName + ': [';
            for (var i = 0; i < result.length; i++) {
                var data = JSON.stringify(result[i]);
                str += data;
                if (i + 1 !== result.length) {
                    str += ',';
                }
            }
            str += ']}';
            callback(file, str, collectionName);
        }
    });
}

function compressFile(fileName) {
    var gzip = zlib.createGzip();
    var inp = fs.createReadStream(outputStream);
    var out = fs.createWriteStream('./dump/input.txt.gz');

    inp.pipe(gzip).pipe(out);
}

function companyDataUpload(companyId) {
    var root = './dump';
    var fileName = companyDataToFile(companyId, root);
    console.log('filename: ' + fileName);
    var path;
    var login;
    var pass;
    var type;
    db.companyCollection().findOne({_id: companyId}, function (err, company) {
       path = company.backupServer.path;
       login = company.backupServer.login;
       pass = company.backupServer.pass;
       type = company.backupServer.type;

        var af = new anyFile();
        var localTmp = './ftpServer';
        var templates = {
            s3: 's3://' + login + ':' + pass + '@s3.amazon.com/' + path + '/' + fileName,
            ftp: 'ftp://' + login + ':' + pass + '@' + path + '/' + fileName,
            local: root + '/' + fileName,
            localTo: localTmp + '/' + fileName
        };
        log.info('local' + templates.local);
        log.info('localTo' + templates.localTo);
        af.from(templates['local']).to(templates['localTo'], function(err, res) {
            if (res) {
                log.debug("File copied!");
            } else {
                log.debug("File not copied!");
            }
        });
    });
    db.companyCollection().updateOne({_id: companyId}, {$set: {lastBackupDate: today}});
    log.debug('-REST result: backup. Company: %s',
      companyId + " " + today);
}

