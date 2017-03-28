const mongoose = require('mongoose');
const MongoDB = require('mongodb');
const chalk = require('chalk');
const DB_PATH = 'mongodb://localhost/news';

const Schema = require('./db/schema');

mongoose.connect(DB_PATH);
var db = mongoose.connection;
const Article = db.model('Article', Schema.article);
db.once('open', function() {
  console.log('Connected to database at', chalk.green.bold(DB_PATH));
});


var islamTerms = ['muslim', 'islam']

setTimeout(function() {
  console.log(chalk.blue.bold('Finding articles...'));
  Article.find().$where('this.title.toLowerCase().indexOf("muslim") > 0 || this.title.toLowerCase().indexOf("islam") > 0')
    .then(function(articles) {
        console.log('Articles with headlines including', chalk.green.bold('islam'), 'or', chalk.green.bold('muslim'), ':', articles.length);
        articles.forEach((article) => {
          console.log(article.title.replace('Muslim', chalk.red.bold('Muslim')).replace('Islam', chalk.red.bold('Islam')));
        })
    }).catch(function() {
      process.exit(0);
    });
}, 2000);
