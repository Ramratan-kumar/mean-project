var logger = require('morgan'),
  cors = require('cors'),
  http = require('http'),
  express = require('express'),
  errorhandler = require('errorhandler'),
  dotenv = require('dotenv'),
  mongoose = require('mongoose'),
  validator_pkg = require('validator');

const cookie_parser = require('cookie-parser');

bodyParser = require('body-parser'),
  fs = require('fs'),
  config = require('./config'),
  compression = require('compression');

var app = express();
//app.use(compression());
app.use(compression({ filter: shouldCompress }))
function shouldCompress(req, res) {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false
  }
  // fallback to standard filter function
  return compression.filter(req, res)
}
// useragent(true);
dotenv.load();

mongoose.Promise = global.Promise;


mongoose.connect(config.pathToMongoDb,function(err,db){
  if(!err)
  console.log("Successfully connected to MongoDB : " + config.pathToMongoDb);
  else{
    console.log("Cannot Connect to mongoDB at " + config.pathToMongoDb);
    console.log("Exiting...");
    process.exit();
  }
})



app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookie_parser());
app.use(cors());

app.use(function(req,res,next){
  next();
});

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
  app.use(errorhandler())
}

http.createServer(app).listen(3000, function (err) {
  console.log('listening on http://localhost:' + 3000);
});




//This should be last always
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: "Unauthorized" });
  }
});

//register router

app.use('/user', require('./router/users'));
app.use('/booking', require('./router/bookingRouter'));

module.exports = app;