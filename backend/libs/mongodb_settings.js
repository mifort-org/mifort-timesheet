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

var MongoClient = require('mongodb').MongoClient;
var testDataImporter = require('./test_data_importer');
var log = require('./logger');

var mongodbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/homogen';
var mongoDbSessionStorageUrl = process.env.MONGO_SESSION_STORAGE_URL
                                 || 'mongodb://localhost:27017/homogen-sessions';

var timelogCollectionName = 'timelogs';
var projectCollectionName = 'projects';
var companyCollectionName = 'companies';
var userCollectionName = 'users';
var cachedDb;

MongoClient.connect(mongodbUrl, function(err, db) {
    if(err) {
        log.error('Mongo DB connection failed', {error: err});
    } else {
        cachedDb = db;
        exports.db = cachedDb;
        log.info('Mongo DB: connected!');
        if(process.env.NODE_ENV !== 'production') {
            testDataImporter.import();
        }
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

exports.sessionMongoUrl = mongoDbSessionStorageUrl;
