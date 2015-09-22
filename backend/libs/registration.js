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
    var project = projects.generateDefaultProject(savedCompany);
    projects.saveInDb(project, function(err, savedProject) {
        console.log('Defaul project is created!');
        if(err) {
            console.log('Cannot save project!'); 
        } else {
            user.assignments = [{
                userId: user._id,
                role: 'Employee',
                workload: '',
                projectName: savedProject.name,
                projectId: savedProject._id
            }];
            users.save(user, function(err, updatedUser) {
                console.log('Default assignment is added!');
            });
        }
    });
};