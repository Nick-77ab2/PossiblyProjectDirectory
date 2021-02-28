let express = require('express');
let bodyParser = require('body-parser');

let app = express(); // handling incoming request
let http = require('http').Server(app);

// parsers to use on incoming data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// using PUG, render HTML
app.engine('pug', require('pug').__express)
app.set('views', '.')
app.set('view engine', 'pug')

app.get('/', function(req, res) {
  res.sendFile('/index.html', { root: '.'});
});

app.get('/create', function(req, res) {
  res.sendFile('/create.html', { root: '.'});
});

app.post('/create', function(req, res, next) {
  client.connect(error => {
    const users = client.db("spelling_bee").collection("users");

    let user = {
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      score: req.body.score,
    };

    users.insertOne(user, function(err, res) {
      // TODO:Fix error, causes server to crash in all scenarios.
      //TODO: CLOSE CLIENT AFTER ALL CONNECTS
      if(err) throw err;
      console.log("1 Row user has been created.");
    });
  })
  client.close();
  res.send('User has been created');
});

app.get('/get', function (req, res) {
  res.sendFile('/get.html', {root:'.'});
});

app.get('/get-client', function (req, res) {
    client.connect(err => {
        console.log(req.query.name);
        client.db("spelling_bee").collection("users").findOne(
          {name: req.query.name}, function(err, result) {
          if (err) throw err;

          res.render('update', 
          {
            oldname: result.name, 
            oldusername: result.username, 
            oldpassword: result.password,
            oldpasswordComfirm: result.passwordConfirm, 
            oldscore: result.score, 
            name: result.name,
            username: result.username,
            password: result.password,
            passwordConfirm: result.passwordConfirm,
            score: result.score,
            });
        });
    });
})

app.post('/update', function(req, res) {
  client.connect(err => {
    if (err) throw err;
    let query = { 
      name: req.body.oldname,
      username: req.body.oldusername
    };
    console.log(query);
    let newvalues = { $set: {
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      score: req.body.score,
    }};
    client.db("spelling_bee").collection("users").updateOne(query, newvalues,function(err, result) {
        if (err) throw err;
        console.log("1 user has been updated");
        client.close();
        res.render('update', {message: 'User updated!',
            oldname: req.body.name, 
            oldusername: req.body.username, 
            oldpassword: req.body.password,
            oldpasswordComfirm: req.body.passwordConfirm, 
            oldscore: req.body.score, 
            name: req.body.name,
            username: req.body.username,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            score: req.body.score,
          });
      });
  });
})

app.post('/delete', function(req, res) {
  client.connect(err => {
    if (err) throw err;
    let query = { 
      name: req.body.name, 
      username: req.body.username ? req.body.username : null,
      password: req.body.password ? req.body.password : null
    }
    client.db("spelling_bee").collection("users").deleteOne(query, function(err, obj) {
      if (err) throw err;
      console.log("1 user deleted");
      client.close();
      res.send(`User ${req.body.name} deleted`);
    });
  });
})

app.set('port', process.env.PORT || 5000);
http.listen(app.get('port'), function(req, res) {
  console.log('Server is listening on port', app.get('port'));
});

const MongoClient = require('mongodb').MongoClient;
const mongo_username = process.env.MONGO_USERNAME
const mongo_password = process.env.MONGO_PASSWORD

const uri = `mongodb+srv://${mongo_username}:${mongo_password}@groupwork.7ykyi.mongodb.net/spelling_bee?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true }); // client to connect to database