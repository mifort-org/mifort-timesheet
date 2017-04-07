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
var schedule = require('node-schedule');
var fs = require('fs');
var zlib = require('zlib');
var async = require('async');
var s3 = require('s3');
var AWS = require('aws-sdk');

var backupFolder = './dump';

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
        if(c.backupFrequency != company.backupFrequency) {
            setBackupSchedule(company._id, company.backupFrequency);
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
    log.info('Backups initiated!')
};

exports.companyBackup  = function (req, res, next) {
    var companyId = utils.getCompanyId(req);
    log.debug('-REST call: Find company by id. Company id: %s', companyId.toHexString());
    companyDataToFile(companyId, function (fileName) {
        companyDataUpload(companyId, fileName, function (uploaded) {
            if (uploaded === false) {
                res.status(400).json({msg: 'Data wasn\'t saved to server'});
            } else {
                res.json({lastBackupDate: new Date()});
            }
        });

    });
};

var backupSchedule = {};

function setBackupSchedule (companyId, period) {
    var periods = {
        month: function () {set('0 0 1 * *');},
        week: function () {set('0 0 * * 0');},
        none: clear
    };
    periods[period]();

    function clear() {
        if (backupSchedule[companyId]) {
            backupSchedule[companyId].cancel();
        }
    }
    function set (time) {
        clear();
        log.debug('setSchedule: ' + time);
        backupSchedule[companyId] = schedule.scheduleJob(time, function(){
            companyDataToFile(companyId, function (fileName) {
                companyDataUpload(companyId, fileName, function (){});
            });
        });
    }
}

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

function companyDataToFile (companyId, callback) {
    var today = new Date;
    today = today.toISOString().match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)[0].replace(/:/, '-');
    db.companyCollection().findOne({_id: {$eq: companyId}}, function (err, company) {
      if (err) {
        throw err;
      }
      var fileName = company.name + '_' + today + '.txt';
      var file = backupFolder + '/' + fileName;
      fs.writeFile(file, '', function(err) {
        if(err) {
          throw err;
        }
        async.waterfall([
          function (callback) {
            collectDataToString('company', {_id: companyId}, file, callback);
          },
          addDataToFile,
          function (callback) {
            collectDataToString('project', {companyId: {$eq: companyId}}, file, callback);
          },
          addDataToFile,
          function (callback) {
            collectDataToString('user', {companyId: {$eq: companyId}}, file, callback);
          },
          addDataToFile,
          function(callback) {
            getCompanyProjects(file, callback);
          },
          function (projects, callback) {
            collectDataToString('timelog', {projectId: {$in: projects}}, file, callback)
          },
          addDataToFile,
          function(callback) {
            compressFile(fileName, callback)
          }
        ], function (err, fileName) {
          if (err) {
            throw err;
          }
          callback(fileName);
        });
      });
    });
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
        callback(null, projects);
    });
}

function addDataToFile (file, data, collection, callback) {
    fs.appendFile(file, data, function (err) {
        if (err) {
            throw err;
        }
        log.info('The "' + collection + ' collection data" was appended to file!');
        callback(null);
    });
}

function collectDataToString(collectionName, query, file, callback) {
    var collection = collectionName + 'Collection';
    db[collection]().find(query).toArray(function(err, result) {
        if (err) {
            throw err;
        } else {
            var str = '{' + collectionName + ': [';
            for (var i = 0; i < result.length; i++) {
                str += JSON.stringify(result[i]);
                if (i + 1 !== result.length) {
                    str += ',';
                }
            }
            str += ']}';
            callback(null, file, str, collectionName);
        }
    });
}

function compressFile(fileName, callback) {
    var gzip = zlib.createGzip();
    var inp = fs.createReadStream(backupFolder + '/' + fileName);
    var newFileName = fileName + '.gzip';
    var file = backupFolder + '/' + newFileName;
    var out = fs.createWriteStream(file);
    var stream = inp.pipe(gzip).pipe(out);
    stream.on('finish', function () {
        log.info('The File compressed! New file name: ' + newFileName);
        deleteDumpFile(fileName);
        callback(null, newFileName);
    });
}

function companyDataUpload(companyId, fileName, callback) {
  db.companyCollection().findOne({_id: companyId}, function (err, company) {
    if (err) {
      throw err;
    }
    var options;
    if (company.backupServer.type === 'ftp') {
      options = {
        host: company.backupServer.host,
        user: company.backupServer.user,
        password: company.backupServer.password,
        port: company.backupServer.port || 21,
        dirName: company.backupServer.dirName
      };
      ftpUpload(options, fileName, callback);
    } else if (company.backupServer.type === 's3') {
      options = {
        bucket: company.backupServer.path,
        accessKey: company.backupServer.login,
        secretKey: company.backupServer.pass,
        dirName: company.backupServer.dirName + (company.backupServer.dirName ? '/' : ''),
        region: company.backupServer.region.endpoint
      };
      s3Upload(options, fileName, callback);
    }
  });
}

function ftpUpload(options, fileName, callback) {
  var pathFrom = backupFolder + '/' + fileName;
  var ftpClient = require('ftp');
  var client = new ftpClient();
  var dirName = options.dirName;

  client.on('ready', function() {
    client.mkdir('/' + dirName, true, function(err) {
      if (err) throw err;
      console.log('Directory successfully created!');
      var pathTo = '/' + dirName + '/' + fileName;
      client.put(pathFrom, pathTo, function (err) {
        if (err) {
          log.error(err);
          return callback(false);
        }
        console.log('File successfully uploaded!');
        deleteDumpFile(fileName);
        callback(true);
      });
      client.end();
    });
  });

  client.connect(options);
}

function s3Upload(options, fileName, callback) {
  var awsS3Client = new AWS.S3({
    accessKeyId: options.accessKey,
    secretAccessKey: options.secretKey,
    region: options.region
  });
  var client = s3.createClient({
    s3Client: awsS3Client
  });
  var uploadParameters = {
    localFile: backupFolder + '/' + fileName,
    s3Params: {
      Bucket: options.bucket,
      Key: options.dirName + fileName
    }
  };
  var uploader = client.uploadFile(uploadParameters);
  uploader.on('error', function(err) {
    log.error("Unable to upload " + fileName + ":", err.stack);
    callback(false);
  });
  uploader.on('end', function() {
    log.info("Upload completed for " + fileName);
    deleteDumpFile(fileName);
    callback(true);
  });
}

exports.companyExport  = function (req, res, next) {
  var companyId = utils.getCompanyId(req);
  log.debug('-REST call: Export company logs. Company id: %s', companyId.toHexString());
  companyDataToFile(companyId, function (fileName) {
    res.download(backupFolder + '/' +fileName, function(err) {
      if (err) {
        log.warn('Company export failed, companyId: %s', companyId);
      }
      log.info('Company export successful, companyId: %s', companyId);
      deleteDumpFile(fileName);
    });
  });
};

function deleteDumpFile(fileName) {
  fs.unlink(backupFolder + '/' + fileName, function(err) {
    if (err) {
      log.warn('Dump file deletion failed, fileName: %s', fileName);
    }
    log.info('Dump file deleted, fileName: %s', fileName);
  });
}