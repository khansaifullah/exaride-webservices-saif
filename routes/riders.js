const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcrypt');
const _ = require('lodash');
var multer  = require('multer')
var upload = multer({ dest: './public/images/profileImages' });
//package for making HTTP Request
var request=require("request");
const {User, validate} = require('../models/user');
const { Driver } = require('../models/driver');
const Rider  = require('../models/rider');
const ShiftRequest  = require('../models/shiftRequest');
const Shift  = require('../models/shift');
const DailyTrip  = require('../models/dailyTrip');
const logger = require('../startup/logging');
const LocController = require('../controller/locationController');
const chatController = require('../controller/chatController');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const NotificationController=require('../controller/PushNotificationController');
const regCtrl = require('../controller/registrationController');
const adminAuth = require('../middleware/adminAuth');
var path = require('path');
var multer = require('multer');
var FormData = require('form-data');
var fs = require('fs');
var tempFileName;
var storage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, './public/images')
	},
	filename: function(req, file, callback) {
	
		tempFileName="";
		tempFileName=file.fieldname + '-' + Date.now() + path.extname(file.originalname);

		logger.info("File NEW Name  :" +tempFileName );
		callback(null,tempFileName );
	}
});

router.get('/', async (req, res) => {
  let listOfRiders = [];
  let ridersResponseObject;

  const riders = await Rider.find({});
  if(!riders) return res.status(400).jsonp({ status: 'failure', messgae: 'riders not found.', object: [] });
  
  for(var i = 0; i< riders.length; i++){
     
    console.log(riders[i]._userId);
    const user = await User.findOne({ _id: riders[i]._userId });
    // if(!user) return res.status(400).jsonp({ status: 'failure', messgae: 'riders not found by given ID.', object: [] });
    if(user){
      ridersResponseObject = {
        _id: riders[i]._id,
       // panic: riders[i].panic,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile_photo_url: user.profile_photo_url,
        loc: user.loc,
        last_shared_loc_time: user.last_shared_loc_time,
        last_notification_time:riders[i].last_notification_time,
        alert: user.alert


      }
      listOfRiders.push(ridersResponseObject);
    }
  }

  res.jsonp({
    status: 'success',
    messgae: 'List of Riders',
    object: listOfRiders
  });
  
});
router.post('/', function (req, res) {

  if (req.body === undefined || req.body === null) {
    res.end("Empty Body");
  }
  console.log("in routes /rider");

  regCtrl.registerRider(req, res);

});


router.post('/profile',function(req,res){
		
  if(req.body === undefined||req.body === null) {
     res.end("Empty Body"); 
     }
 try {
  console.log("in routes - profile : " + req.body.phone);
  var upload = multer({
    storage: storage,
    fileFilter: function(req, file, callback) {			
      var ext = path.extname(file.originalname)
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' && ext !== '.PNG' && ext !== '.JPG' && ext !== '.GIF' && ext !== '.JPEG') {
        return callback(res.end('Only images are allowed'), null)
      }
      callback(null, true)
    }
  }).single('profilePhoto');
  upload(req, res, function(err) {
    if (err){
      
      logger.info("Error Uploading File : " + err);
      res.jsonp({status:"Failure",
            message:"Error Uploading File",
            object:[]});
    }
    else{
      logger.info ("File Is uploaded , file name: " + tempFileName);
      logger.info ("Phoen num: " + req.body.phone);
      try{
        var form = new FormData();
        form.append('image', fs.createReadStream( './/public//images//'+tempFileName));
        form.submit('http://exagic.com/postimage.php', function(err, resp) {
         if (err) {
           logger.info("Error : "+ err);
           res.jsonp({status:"Failure",
           message:"Error Uploading File",
           object:[]});
         }else {
          var body = '';
          resp.on('data', function(chunk) {
            body += chunk;
          });
          resp.on('end', function() {
            var urls = JSON.parse(body);
            console.log("File Url : "+urls.imageurl);
            var fileUrl=urls.imageurl;
   
   
            //regCtrl.completeProfile(req.body,fileUrl,res);
            
           regCtrl.registerRider(req, fileUrl, res);
   
            tempFileName="";
           });
         }
       });
      }catch(ex){
        logger.info ("An exception occured in post req" + ex);
        regCtrl.registerRider(req, '', res);

      }

    }
    
  })
 }catch (exception){
  logger.info ("Exception Occured : " + exception);
 }

 
});
 
router.post('/trip', function(req, res) {

  if (req.body === undefined || req.body === null) {
    res.send("Empty Body");
  }
  
  console.log("in routes /trip");
  var shiftId = req.body.shiftId;
  var riderId = req.body.riderId;
  var pickUpTime = req.body.pickUpTime;
  var dropOffTime = req.body.dropOffTime;
  

  let dailyTrip= new DailyTrip({
    
    _shiftId: shiftId ,
    _riderId: riderId,
    isGoing: false ,
    canceledByRider: true,
    pickUpTime: pickUpTime,
    dropOffTime:dropOffTime ,
});

dailyTrip.save(function (err, dailyTrip) {
    if(err){
        logger.error('Some Error Updating Daily Trip Info' + err );
        res.jsonp({status:"failure", message:"Some Error while Updating Daily Trip Info.", object:[]}); 
    }else {
      res.jsonp({
        status : "success",
        message : "Trip Info Update",
        object : dailyTrip
    });

    }
  });

});


router.post('/cancel/trip', function(req, res) {

  if (req.body === undefined || req.body === null) {
    res.send("Empty Body");
  }
  
  console.log("in routes cancel/trip");
  var shiftId = req.body.shiftId;
  var riderId = req.body.riderId;
  // var pickUpTime = req.body.pickUpTime;
  // var dropOffTime = req.body.dropOffTime;
  

  let dailyTrip= new DailyTrip({
    
    _shiftId: shiftId ,
    _riderId: riderId,
    isGoing: false ,
    canceledByRider: true,
    pickUpTime: null,
    dropOffTime:null ,
   
});

dailyTrip.save(function (err, dailyTrip) {
    if(err){
        logger.error('Some Error Updating Daily Trip Info' + err );
        res.jsonp({status:"failure", message:"Some Error while Updating Daily Trip Info.", object:[]}); 
    }else {
      res.jsonp({
        status : "success",
        message : "Trip Info Update",
        object : dailyTrip
    });

    }
  });

});

router.post('/pickuplocation', function (req, res) {

    if (req.body === undefined || req.body === null) {
      res.end("Empty Body");
    }
    console.log("in routes /location");
    var reqData = req.body;
    LocController.riderPickUPLocation(reqData, res);

  });

router.post('/alert', function(req, res) {

  if (req.body === undefined || req.body === null) {
    res.send("Empty Body");
  }

  if(req.body.phoneNo === null){
    res.send('Empty PhoneNo');
  }
  console.log("in routes /alert");
  var reqData = req.body;
  chatController.sendAlertToRider(reqData, res);

});

router.post('/alertToDriver', function(req, res) {

  if (req.body === undefined || req.body === null) {
    res.send("Empty Body");
  }
  
  console.log("in routes /alert");
  var reqData = req.body;
  chatController.sendAlertToDriver(reqData, res);

});

router.post('/onesignal', async (req, res) => {                           
		
	if(req.body === undefined||req.body === null) {
    res.end("Empty Body");  
  }
  logger.verbose('onesignal-POST called ');
  
  let phone = req.body.phone;
  let oneSignalId = req.body.oneSignalId;

  const user = await User.findOne({ phone: phone });

  const rider = await Rider.findOne({ _userId: user._id  });
  
  rider.onesignalid = oneSignalId;
  await rider.save();
 
  if (!rider) return res.status(404).send('rider not found by the given ID.');

  res.status(200).jsonp({ status: 'success', message: 'One Signal Id Updated!', object: rider });

});


router.get('/driverLoc', async (req, res) => {

   console.log('Driver loc for  Rider ID ', req.query.riderId);
  let shiftRequest = await ShiftRequest.findOne({ _riderId: req.query.riderId });
  if(!shiftRequest) return res.status(404).jsonp({ status : "failure", message : "No shift record found for this User.", object : []});

  // finding shift for against given shift Id In Shift Request
  const shift = await Shift.findOne({ _id: shiftRequest._shiftId });
  if ( !shift ) return res.status(404).jsonp({ status : "failure", message : "Shift cannot fint by the given ID.", object : []});
      

  const driver = await Driver.findOne({ _id: shift._driverId });
  if(!driver) return res.status(404).jsonp({ status : "failure", message : "Driver not found with the given ID.", object : []});
 
  const userDriver = await User.findOne({ _id: driver._userId });
  if(!userDriver) return res.status(404).jsonp({ status : "failure", message : "User not found with the given ID.", object : []});
        
    res.jsonp({
      status : "success",
      message : "Driver Location",
      object : userDriver.loc
  });
});

module.exports = router; 