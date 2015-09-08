var users = require('../user');
var companies = require('../company');
var projects = require('../project');

var company = {
    "name": "Mifort",
    "description": "Bla bla"
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
    companies.save(company, function(err, savedCompany){
        project.companyId = savedCompany._id;
        user.companyId = savedCompany._id;
        projects.saveInDb(project, function(err, savedProject){
            user.assignments[0].projectId = savedProject._id;
            users.save(user, function(err, savedUser){
                console.log('Test data is imported!');
            });
        });
    });
};