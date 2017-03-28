var nunjucks  = require('nunjucks');
var express   = require('express');
const mongoose = require('mongoose');
const MongoDB = require('mongodb');
const DB_PATH = 'mongodb://localhost/news';
const chalk = require('chalk');

const Schema = require('./db/schema');

mongoose.connect(DB_PATH);
var db = mongoose.connection;
const Article = db.model('Article', Schema.article);
db.once('open', function() {
  console.log('Connected to database at', chalk.green.bold(DB_PATH));
});

var app = express();

app.listen(3000);

nunjucks.configure('views', {
  autoescape: true,
  express   : app
});

app.get('/', function(req, res) {
    Article.find().$where('this.title.toLowerCase().indexOf("muslim") > 0 || this.title.toLowerCase().indexOf("islam") > 0')
    .then(function(articles) {
        res.render('index.html', articles);
    });
});