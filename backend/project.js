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
var users = require('./user');
var log = require('./libs/logger');
var constants = require('./libs/config_constants');

//Rest API
exports.restGetById = function(req, res, next) {
    var projectId = utils.getProjectId(req);
    log.debug('-REST call: Get project by id. Project id: %s', projectId.toHexString());

    var projects = db.projectCollection();
    projects.findOne({_id: projectId},
        function(err, doc) {
            returnProjectCallback(err, res, doc, next);
            log.debug('-REST result: Get project by id. Project id: %s', doc._id.toHexString());
        }
    );
};

exports.restSave = function(req, res, next) {
    var project = req.body;
    log.debug('-REST call: Save(Create/Update) project. Project name: %s', project.name);

    if(project._id) { //update
        updateProject(project, res, next);
    } else { //create
        createProject(project, res, next);
    }
};

exports.restGetByCompanyId = function(req, res, next) {
    var companyId = utils.getCompanyId(req);
    log.debug('-REST call: Get projects by company id. Company id: %s', companyId.toHexString());

    var projects = db.projectCollection();
    projects.find({companyId: companyId})
        .toArray(function(err, findedProjects){
            if(err) {
                err.code = 404;
                next(err);
            } else {
                res.json(findedProjects);
                log.debug('-REST result: Get projects by company id. Number of projects: %d',
                    findedProjects.length);
            }
        });
};

exports.restDeactivateProject = function(req, res, next) {
    var projectId = utils.getProjectId(req);
    log.debug('-REST call: Deactivate project. Project id: %s', projectId.toHexString());

    var projects = db.projectCollection();
    projects.update({ _id: projectId},
                    {$set: { active: false } },
        function(err, savedProject) {
            if(err) {
                next(err);
                return;
            }
            markAssignments(projectId);
            projects.findOne({_id: projectId},
                function(err, doc) {
                    returnProjectCallback(err, res, doc, next);
                    log.debug('-REST result: Deactivate project. Project id: %s',
                        doc._id.toHexString());
                });
        });
};

exports.restDeleteProject = function(req, res, next) {
    var projectId = utils.getProjectId(req);
    log.debug('-REST call: Delete project. Project id: %s', projectId.toHexString());

    var projects = db.projectCollection();
    projects.remove({_id: projectId}, {single: true},
      function(err, numberOfDeleted){
        if(err) {
            next(err);
        } else {
            deleteAssignments(projectId);
            res.status(204).json({ok: true});
            log.debug('-REST result:  Delete project. Project id: %s', projectId.toHexString());
        }
    });
}

//Public API
exports.saveInDb = function(project, callback) {
    var projects = db.projectCollection();
    projects.save(project, {safe:true}, function (err, result) {
        if(result.ops) {
            callback(err, result.ops[0]);
        } else {
            callback(err, project);
        }
    });
};

exports.generateDefaultProject = function(company) {
    return {
        name: company.name,
        template: company.template,
        periods: company.periods,
        dayTypes: company.dayTypes,
        defaultValues: company.defaultValues,
        availablePositions: constants.DEFAULT_AVAILABLE_POSITIONS,
        companyId: company._id,
        active: true
    };
};

exports.findProjectIdsByCompanyId = function(companyId, callback) {
    var projects = db.projectCollection();
    projects.find({companyId: companyId},
                  {_id:1})
        .toArray(function(err, findedProjectIds){
            var projectIdArray = findedProjectIds.map(function(object) {
                return object._id;
            });
            callback(err, projectIdArray);
        });
};

//Private
function returnProjectCallback(err, res, savedProject, next) {
    if(err) {
        next(err);
        return;
    }
    res.json(savedProject);
}

function updateProject(project, res, next) {
    var projects = db.projectCollection();
    projects.find({_id: project._id,
                   name: {$ne: project.name}},
                  {limit: 1})
        .count(function(err, count) {
            if(count > 0) {
                projects.update({ _id: project._id },
                                {$set: {
                                    name: project.name
                                },
                                $currentDate: { updatedOn: true }},
                    function(err, savedProject) { //need error handler
                        projects.findOne({_id: project._id},
                            function(err, doc) {
                                returnProjectCallback(err, res, doc, next);
                                log.debug('-REST result: Save(Update) project. Project id: %s',
                                    doc._id.toHexString());
                            }
                        );
                        users.updateAssignmentProjectName(project);
                    });
            } else {
                res.json({message: "Project doesn't exist or Project name is not changed"});
                log.debug("-REST result: Save(Update) project. Project doesn't exist or Project name is not changed");
            }
        });
}

function createProject(project, res, next){
    var projects = db.projectCollection();
    companies.findById(project.companyId, function(err, company) {
        if(err) {
            err.code = 404;
            next(err);
            return;
        }
        project.defaultValues = company.defaultValues;
        project.template = company.template;
        project.periods = company.periods;
        project.dayTypes = company.dayTypes;
        var currentDate = new Date();
        project.createdOn = currentDate;
        project.updatedOn = currentDate;
        project.active = true;
        project.availablePositions = company.availablePositions;

        projects.insertOne(project, {safe: true},
            function(err, result) {
                if(err) {
                    next(err);
                } else {
                    res.json(result.ops[0]);
                    log.debug('-REST result: Save(Create) project. Project id: %s',
                        result.ops[0]._id.toHexString());
                }
            });
    });
}

function markAssignments(projectId) {
    var users = db.userCollection();
    users.find({'assignments.projectId': projectId})
        .toArray(function(err, findedUsers) {
            if(findedUsers) {
                addArchivedFlag(findedUsers, projectId);
            }
        });
}

function addArchivedFlag(findedUsers, projectId) {
    var users = db.userCollection();
    findedUsers.forEach(function(user) {
        var assignmentsForProject = user.assignments.filter(function(assignment){
            return assignment.projectId.equals(projectId);
        });

        var newAssignments = assignmentsForProject.map(function(assignment){
            assignment.archived = true;
            return assignment;
        });
        users.update({_id: user._id},
                     { $pull: {assignments: {projectId: projectId} } },
            function(err, result) {
                if(!err) {
                    users.update({ _id: user._id },
                                 { $push: { assignments: { $each: newAssignments } }},
                        function(err, updatedUser){
                            if(!err) {
                                log.info('User assignment was deactivated: %s', user._id.toHexString());
                            } else {
                                log.warn('Assignment is not deactivated', assignment);
                            }
                        });
                }
            });
    });
}

function deleteAssignments(projectId) {
    var users = db.userCollection();
    users.find({'assignments.projectId': projectId})
        .toArray(function(err, findedUsers) {
            if(findedUsers) {
                findedUsers.forEach(function(user) {
                    users.update({_id: user._id},
                                 { $pull: {assignments: {projectId: projectId} } },
                         function(err, updatedUser){
                             if(!err) {
                                 log.info('User assignment is deleted: %s', user._id.toHexString());
                             } else {
                                 log.warn('Cannot delete user assignment', assignment);
                             }
                        });
                });
            }
        });
}
