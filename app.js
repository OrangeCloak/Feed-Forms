const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

//**************using dotenv for storing credentials****************************

require('dotenv').config();

const app = express();
app.set('view engine' , 'ejs');
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

//*****************************Setting Up MongoDB Database**********************

mongoose.connect("mongodb://localhost:27017/feedDB");

const formSchema = new mongoose.Schema({
  name : String ,
  email : String,
  feedback : String,
  rating : Number,
});

const Form = mongoose.model("forms" , formSchema);


//*************************************OAuth************************************


const oauth2Client = new OAuth2(
  process.env.CLIENT_ID, // ClientID
  process.env.CLIENT_SECRET, // Client Secret
  "https://developers.google.com/oauthplayground" // Redirect URL
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

const accessToken = oauth2Client.getAccessToken()


//***************************Sending Mail using nodemailer**********************

const smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "urvesh28062003@gmail.com",
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    accessToken: accessToken,
    tls: {
      rejectUnauthorized: false
    }
  }
});


//**********************************Home Route**********************************


app.route("/")
  .get(function(req ,res){
    res.render("home");
  })

  .post(function(req ,res){

    //sending mail to user through nodemailer :
    const mailOptions = {
         from: "urvesh28062003@gmail.com",
         to: req.body.userEmail,
         subject: "Thank You For Your FeedBack",
         generateTextFromHTML: true,
         html: "<b>For WEC NITK</b>"
    };

    smtpTransport.sendMail(mailOptions, (error, response) => {
         error ? console.log(error) : console.log(response);
         smtpTransport.close();
    });


    //storing user inputs in database:
    const userFeed = new Form({
      name : req.body.userName,
      email : req.body.userEmail,
      feedback : req.body.userFeed,
      rating : req.body.userRating
    });

    userFeed.save(function(err , results){
      if(err){
        console.log(err);
        res.send("Oops! There was an error while accepting your Feedback! Please try again")
      }else{

        Form.find({email : req.body.userEmail} , function(err , foundResult){
          if(err){
            console.log(err)
          }else{
            res.render("dashboard" , {foundResult : foundResult})
          }
        });
      };
    });

  });


//**********************************Dashboard Route*****************************


app.route("/dashboard")
  .get(function(req , res){

    res.render("dashboard");
  });


//******************************************************************************


app.listen(3000 , function(){
  console.log("Server started At Port 3000!");
});
