var mongodb = require('mongodb');

var server = new mongodb.Server('localhost', 27017, {});
var client = new mongodb.Db('homogen', server, {w: 1});

//sample
var product = {
    name: "testname",
    description: "test description"
};

exports.get = function(req, res) {
    var id = req.params.id;
    console.log(id);
    if(id) {
    	var _id = mongodb.ObjectID(id);
        client.open(function(err) {
            if (err) { client.close();}
              
            var collection = client.collection('test_insert');

            collection.find({_id: _id}).toArray(
                function(err, docs) {
                    if (err) {client.close();};
                    console.log("Count of inserted items: " + docs.length);
                    console.log(docs);
                    res.json(docs);
                    client.close();
                }
            );
        });
    }
};

exports.save = function(req, res) {
    client.open(function(err) {
          if (err) { client.close();}
          
          var collection = client.collection('test_insert');

        collection.insert(
              req.body,
              {safe: true},
              function(err, result) {
                if (err) {client.close();};
                console.log("Count of inserted items: " + result.result.n);
                console.log(result.ops);
                res.json(result.ops[0]);
                client.close();
              }
        );
    });
};
