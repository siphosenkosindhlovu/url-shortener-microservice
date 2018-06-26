'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var dns = require('dns');
var url = require('url');
var autoIncrement = require('mongoose-auto-increment');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);
autoIncrement.initialize(mongoose.connection)
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}))
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});
var Schema = mongoose.Schema
var siteSchema = new Schema({
  original_url: {type: String},
  short_url: {type: Number}
})

siteSchema.plugin(autoIncrement.plugin, {model:'Site', field: 'short_url'})
var Site = mongoose.model('Site', siteSchema)

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});
app.post("/api/shorturl/new", function(req, res){
  var original_url = url.parse(req.body.url, true)
  
  dns.lookup(original_url.host, function(err, addr){
      if(err) return res.json({"error": "Invalid URL"})
      var site = new Site({original_url: original_url.host})
      site.save(function(err, data){
        console.log(err);
        if (err) return res.json({"error": "An error occured"})
        var {original_url, short_url} = data
        res.json({original_url, short_url})
      })
  })
})

app.get("/api/shorturl/:shorturl", function(req, res){
  var short_url = req.params.shorturl;
  Site.findOne({short_url: short_url}, function(err, data){
    if(err) return res.json({"error": "An error occured"}) 
    res.redirect(`http://${data.original_url}`)
 })
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});