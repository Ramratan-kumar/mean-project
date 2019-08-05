var logger = require('morgan'),
  cors = require('cors'),
  http = require('http'),
  express = require('express'),
  errorhandler = require('errorhandler'),
  dotenv = require('dotenv'),
  mongoose = require('mongoose'),
  validator_pkg = require('validator');
//var ingester = require("./controller/ingester1");
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

readConfigFromEnvVariables();

//mongoose.Promise = global.Promise;


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
app.use(cors());

if (process.env.NODE_ENV === 'development') {
  app.use(logger('dev'));
  app.use(errorhandler())
}

//ingester.triggerBoxofficeIngester();


http.createServer(app).listen(3000, function (err) {
  console.log('listening on http://localhost:' + 3000);
});

function readConfigFromEnvVariables() {
  if (process.env.pathToMongoDb != null) {
    config.pathToMongoDb = process.env.pathToMongoDb;
  }
  if (process.env.tmsConfig_url != null) {
    config.tmsConfig_url = process.env.tmsConfig_url;
  }
  /*if(process.env.foa_core_url != null){
    config.foa_core_url = process.env.foa_core_url;
  }*/

  console.log("Using MongoDB from : " + config.pathToMongoDb);
  // console.log("Using FoA core URL as : " + config.foa_core_url);
  try {
    console.log(validator_pkg.escape(fs.readFileSync('build.html', 'utf8').toString()));
  } catch (err) { }
}


//This should be last always
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ message: "Unauthorized" });
  }
});

//register router

app.use('/user', require('./router/users'));

module.exports = app;