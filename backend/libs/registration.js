var companies = require('../company');
var users = require('../user');
var projects = require('../project');

var registrationRedirect = '/company';

exports.createUser = function(user, callback) {
    users.save(user, function(err, savedUser){
        if(err) {
            callback(err, savedUser);
        } else {
            var company = companies.generateDefaultCompany();
            company.ownerId = savedUser._id;
            companies.save(company, function(err, savedCompany){
                console.log('Defaul company is created!');
                if(err) {
                    callback(err, savedUser);
                } else {
                    var project = projects.generateDefaultProject(savedCompany);
                    projects.saveInDb(project, function(err, savedProject) {
                        console.log('Defaul project is created!');
                        if(err) {
                            callback(err, savedUser);
                        } else {
                            savedUser.assignments = [{
                                userId: savedUser._id,
                                role: 'CEO',
                                workload: '',
                                projectName: savedProject.name,
                                projectId: savedProject._id
                            }];
                            users.save(savedUser, function(err, updatedUser) {
                                callback(null, updatedUser);
                            });
                        }
                    });
                }
            });
        }
    });
};
