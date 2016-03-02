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

var db = require('./libs/mongodb_settings');
var utils = require('./libs/utils');
var companies = require('./company');
var log = require('./libs/logger');

//Rest API
exports.restGetCurrent = function(req, res) {
    log.debug('-REST call: Get current user. Empty user?: ' + (req.user == true));
    res.json(req.user);
};

exports.restGetByProjectId = function(req, res, next) {
    var projectIdParam = utils.getProjectId(req);
    log.debug('-REST call: Get users by project id. Project id: %s',
        projectIdParam.toHexString());
    var users = db.userCollection();
    users.find({'assignments.projectId': projectIdParam},
               { workload: 1,
                 displayName: 1,
                 assignments: 1})
      .toArray(function(err, projectUsers) {
        if(err) {
            err.code = 404;
            next(err);
        } else {
            if(projectUsers) {
                projectUsers.forEach(function(user) { // not efficient???? Maybe: Client side???
                    user.assignments = user.assignments.filter(function(assignment) {
                       return projectIdParam.equals(assignment.projectId);
                    });
                });
            }
            res.json(projectUsers);
            log.debug('-REST result: Get users by project id. Project id: %s, Number Of users: %d',
                projectIdParam.toHexString(), projectUsers.length);
        }
    });
};

exports.restGetByCompanyId = function(req, res, next) {
    var companyIdParam = utils.getCompanyId(req);
    log.debug('-REST call: Get users by company id. Company id: %s',
        companyIdParam.toHexString());

    var users = db.userCollection();
    users.find({companyId: companyIdParam},
               {workload: 1,
                displayName: 1,
                role: 1,
                email: 1})
        .toArray(function(err, companyUsers) {
            if(err) {
                err.code = 404;
                next(err);
            } else {
                res.json(companyUsers);
                log.debug('-REST result: Get users by company id. Company id: %s. Number of company users: %d',
                    companyIdParam.toHexString(), companyUsers.length);
            }
        });
};

exports.restReplaceAssignments = function(req, res, next) {
    var projectId = utils.getProjectId(req);

    log.debug('-REST call: Replace assignments. Project id: %s',
        projectId.toHexString());

    var user = req.body;
    var assignments = user.assignments;
    var users = db.userCollection();
    users.update({ _id: user._id },
                 { $pull: {assignments: {projectId: projectId} } },
                 { multi: true },
        function(err, result) {
            if(!err) {
                users.update({ _id: user._id },
                             { $push: { assignments: { $each: assignments } }},
                    function(err, updatedUser){
                        res.json({ok: true}); //saved object???
                        log.debug('-REST result: Replace assignments. Project id: %s',
                            projectId.toHexString());
                    });
            } else {
                next(err);
            }
        });
};

exports.restUpdateUserRole = function(req, res, next) {
    var user = req.body;
    log.debug('-REST call: Update user role. User id: %s, role: %s',
        user._id.toHexString(), user.role);

    var users = db.userCollection();
    users.update({_id:user._id},
                 {$set : {
                        role: user.role
                    }
                 },
        function(err, result) {
            if(err) {
                next(err);
            } else {
                log.debug('-REST result: Update user role. User id: %s, role: %s',
                    user._id.toHexString(), user.role);
                res.json({ok: 'true'});
            }
        });
};

exports.restDeleteUser = function(req, res, next) {
    var userId = utils.getUserId(req);
    log.debug('-REST call: Delete user. User id: %s', userId.toHexString());

    var users = db.userCollection();
    users.remove({_id: userId}, {single: true},
      function(err, numberOfDeleted){
        if(err) {
            next(err);
        } else {
            res.status(204).json({ok: true}); //204 No content???
            log.debug('-REST result: Delete user. User id: %s', userId.toHexString());
        }
    });
};

exports.restAddNewUser = function(req, res, next) {
    var user = req.body;
    log.debug('-REST call: Add user. User email: %s', user.email);

    if(!user.displayName) {
        user.displayName = user.email;
    }
    var users = db.userCollection();
    users.insertOne(user, {safe: true},
        function(err, result) {
            if(err) {
                next(err);
            } else {
                res.json(result.ops[0]);
                log.debug('-REST result: User is added. User email: %s', user.email);
            }
        });
};

//Public API
exports.save = function(user, callback) {
    var users = db.userCollection();
    users.save(user, {safe:true}, function (err, result) {
        if(result.ops) {
            callback(err, result.ops[0]);
        } else {
            callback(err, user);
        }
    });
};

exports.updateExternalInfo = function(user, callback) {
    var users = db.userCollection();
    users.update({_id:user._id},
                 {$set : {
                        displayName: user.displayName,
                        external: user.external
                    }
                 },
        function(err, result) {
            callback(err, result);
        });
};

exports.updateAssignmentProjectName = function(project) {
    if(project) {
        var users = db.userCollection();
        users.find({'assignments.projectId': project._id,
                    'assignments.projectName': {$ne: project.name}})
            .toArray(function(err, findedUsers) {
                if(findedUsers) {
                    updateProjectName(users, findedUsers, project);
                }
            });
    }
};

exports.findByEmail = function(email, callback) {
    findByExample({email: email}, callback);
};

exports.findById = function(id, callback) {
    findByExample({_id:id}, callback);
};

exports.findByExample = findByExample;

//private
function findByExample(query, callback) {
    var users = db.userCollection();
    users.findOne(query, function(err, user){
        callback(err, user);
    });
}

function updateProjectName(userDbCollection, findedUsers, project) {
    findedUsers.forEach(function(user) {
        var assignmentsForProject = user.assignments.filter(function(assignment){
            return assignment.projectId.equals(project._id);
        });

        var newAssignments = assignmentsForProject.map(function(assignment){
            assignment.projectName = project.name;
            return assignment;
        });
        userDbCollection.update({_id: user._id},
                     { $pull: {assignments: {projectId: project._id} } },
            function(err, result) {
                if(!err) {
                    userDbCollection.update({ _id: user._id },
                                 { $push: { assignments: { $each: newAssignments } }},
                        function(err, updatedUser){
                            log.info('User assignment project name was updated: %s', user._id.toHexString());
                        });
                }
            });
    });
}
