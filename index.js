let express = require('express');
let bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
let app = express(); // handling incoming request
let http = require('http').Server(app);
const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );
app.use(express.static('public_html'));

// parsers to use on incoming data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



const saltRounds = 10;
app.get('/', function(req, res) {
  res.status(200).sendFile(__dirname + "\\public_html\\index.html\\");
});

app.get('/create', function(req, res) {
  res.sendFile('/createUser.html', { root: '.'});
});

app.post('/create', function(req, res, next) {
  client.connect(error => {
    const users = client.db("spelling_bee").collection("users");
    //TODO: hash password?
    if((!req.body.hasOwnProperty("username")) || 
	   (!req.body.hasOwnProperty("password")) ||
       (!req.body.hasOwnProperty("confirmPassword")) ||
	   (!(typeof req.body.username=="string")) ||
	   (!(typeof req.body.password=="string")) ||
       (!(typeof req.body.confirmPassword=="string")) ||
       (req.body.username==users.findOne({username: req.body.username})) ||
       ((req.body.username.length < 1) || (req.body.username.length > 20)) ||
	   ((req.body.password.length < 5) || (req.body.password.length > 36)) ||
       (req.body.confirmPassword!==req.body.password))
       {
		    return res.status(401).send("");
       }
    let user;
     bcrypt
        .hash(req.body.password, saltRounds)
        .then(function (hashedPassword){
          user = {
            username: req.body.username,
            password: hashedPassword,
            score: req.body.score,
          };
        });

    users.insertOne(user, function(err, res) {
      // TODO:Fix error, causes server to crash in all scenarios.
      //TODO: CLOSE CLIENT AFTER ALL CONNECTS
      if(err) throw err;
      console.log("1 Row user has been created.");
    });
  })
  client.close();
  res.send('User has been created');
}); //end of app.post

app.get('/get', function (req, res) {
  res.sendFile('/getUser.html', {root:'.'});
});

app.get('/get-client', function (req, res) {
    client.connect(err => {
        client.db("spelling_bee").collection("users").findOne(
          {username: req.query.username}, function(err, result) {
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
});
app.get('/login', function(req, res){
    let user = client.db("spelling_bee").collection("users").findOne(
          {username: req.query.username}, function(err, result) {
            if(err){
              return res.status(401).send("Incorrect account info.");
            }
          });
    bcrypt
    .compare(req.body.password, user.password)
    .then(function(isSame){
        if(isSame)
          res.status(200).send();
        else
           res.status(401).send("Incorrect account info.");
    }) 
    .catch(function (error) {
        console.log(error);
        res.status(500).send("The server had an issue, please try again.");
    });
});

/*app.post('/update', function(req, res) {
  client.connect(err => {
    if (err) throw err;
    let user = client.db("spelling_bee").collection("users").findOne(
          {username: req.query.username}, function(err, result) {
            return res.status(401).send("");
          });
    if(bcrypt.compare(req.body.password, user.password)){
    let query = { 
      username: req.body.oldusername,
    };
    }
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
*/
/*app.post('/delete', function(req, res) {
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
*/
app.set('port', process.env.PORT || 5000);
http.listen(app.get('port'), function(req, res) {
  console.log('Server is listening on port', app.get('port'));
});

const MongoClient = require('mongodb').MongoClient;
const mongo_username = process.env.MONGO_USERNAME
const mongo_password = process.env.MONGO_PASSWORD

const uri = `mongodb+srv://${mongo_username}:${mongo_password}@groupwork.7ykyi.mongodb.net/spelling_bee?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true }); // client to connect to database