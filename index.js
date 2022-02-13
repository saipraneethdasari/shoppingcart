const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const config = require("./config/database");
const bodyParser = require("body-parser");
const session = require("express-session");
const expressValidator = require("express-validator");
const fileUpload = require("express-fileupload");
const mkdirp = require('mkdirp');
const fs = require('fs');
const passport = require('passport');

mongoose.connect(config.database);
const db=mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    console.log("connected to MongoDb");
});
const app = express();

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');


app.use(express.static(path.join(__dirname,'public')));
app.locals.errors = null;

const Page = require('./models/page');
const Category = require('./models/category');


Page.find({}).sort({sorting : 1}).exec(function(err,pages){
  if(err){
    console.log(err);
  }
  else{
    app.locals.pages = pages;
  }
});

Category.find(function(err,categories){
  if(err){
    console.log(err);
  }
  else{
    app.locals.categories = categories;
  }
});

app.use(fileUpload());

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    // cookie: { secure: true }
  }));

 app.use(expressValidator({
  customValidators: {
    isImage: function(value, filename){
      var extension = path.extname(filename).toString().toLowerCase() ;
        switch(extension){
          case '.jpg' :
            return '.jpg';
          case '.jpeg' :
            return '.jpeg';
          case '.png' :
            return '.png';
          case '' :
            return '.jpg';
          default :
             return false;
        }
    }
  
}
}));

 
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session())

app.get('*',function (req, res, next) {
  res.locals.cart = req.session.cart;
  res.locals.user = req.user || null;
  next();
});


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


const pages = require("./routes/pages.js");
const products = require("./routes/products.js");
const cart = require("./routes/cart.js");
const users = require("./routes/users.js");
const adminPages = require("./routes/admin_pages.js");
const adminCategories = require("./routes/admin_categories.js");
const adminProducts = require("./routes/admin_products.js");


app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/products',products);
app.use('/cart',cart);
app.use('/users',users);
app.use('/', pages);




const port = 3000;
app.listen(port,function(){
    console.log('listening at '+ port);
})