var path = require('path');
var mv = require('mv');

exports.upload = function(req, res, next) {
	console.log(req);
	console.log(req.body);
	if(req.files) {
		var tempPath = req.files.myFile.path,
	    targetPath = path.resolve('./uploadFiles/' + req.files.myFile.name);
	    console.log(targetPath);
		mv(tempPath, targetPath, function(err) {
			if (err) next(err);
			console.log("Upload completed!");
			res.redirect('/');
		});
	}
};