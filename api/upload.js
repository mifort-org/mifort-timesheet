var path = require('path');
var mv = require('mv');

exports.upload = function(req, res, next) {
	var data = req.body;
	if(req.files) {
		var tempPath = req.files.myFile.path;
		var sourceFileName = req.files.myFile.name;
		var targetFileName = data.login + path.extname(sourceFileName);
	    
	    var targetPath = path.resolve('./uploadFiles/' + targetFileName);
	    console.log(targetPath);
		mv(tempPath, targetPath, function(err) {
			if (err) next(err);
			console.log("Upload completed!");
			res.redirect('/');
		});
	}
};