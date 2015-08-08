exports.getByProjectName = function(db) {
    return function(req, res) {
        var projects = db.collection('projects');
        projects.find({id:"13"}, {calendar:1, periods:1}).toArray(function(err, docs) {
            res.json(docs);
        });
    }
}
