var MongoClient = require('mongodb').MongoClient;

var testDataImporter = require('./test_data_importer');

var mongodbUrl = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/homogen';

var timelogCollectionName = 'timelogs';
var projectCollectionName = 'projects';
var companyCollectionName = 'companies';
var userCollectionName = 'users';
var cachedDb;

MongoClient.connect(mongodbUrl, function(err, db) {
    if(err) {
        console.log('Mongo DB connection failed');
        console.log(err);
    } else {
        cachedDb = db;
        exports.db = cachedDb;
        console.log('Mongo DB: connected!');
        testDataImporter.import();
    }
});

exports.timelogCollection = function() {
    return cachedDb.collection(timelogCollectionName);
};

exports.projectCollection = function() {
    return cachedDb.collection(projectCollectionName);
};

exports.userCollection = function() {
    return cachedDb.collection(userCollectionName);
};

exports.companyCollection = function() {
    return cachedDb.collection(companyCollectionName);
};