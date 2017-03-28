
// Make HTML requests to get page
const request = require('request');
// Parse HTML using jQuery syntax
const cheerio = require('cheerio');


// ORM for MongoDB (like Sequelize)
const mongoose = require('mongoose');
// NoSQL database for storing objects
const mongodb = require('mongodb');
// Style console output
const chalk = require('chalk');

// Connect to database
const Schema = require('./db/schema.js');
const PAGE_URL = "http://www.breitbart.com/news/source/breitbart-news/page";
const DB_PATH = 'mongodb://localhost/news_test';
mongoose.connect(DB_PATH);
var db = mongoose.connection;
var connection = setTimeout(function() {
  throw new Error('Failed at database connection');
}, 10000); // 10s connection attempt timeout
db.once('open', function() {
  clearTimeout(connection);
  console.log(chalk.green.bold('Connected'), DB_PATH);
  // Import model and create table
  Article = db.model('Article', Schema.article);
  // Run scrape starting at page parameter
  initiateScrape();
});

function logOutput(title) {
  var terms = {
    'Islam': [
      'jihad',
      'islam',
      'muslim',
      'allah',
      'quran'
    ],
    'Mexico': [
      'mexico',
      'mexican',
      'hispanic',
      'alien',
      'immigrant',
      'immigration',
      'refugee'
    ]
  }
  var normalizedTitle = title.toLowerCase();
  var flagged = false;
  Object.keys(terms).forEach(function(key) {
    var arr = terms[key];
    arr.forEach(function(term) {
      if(flagged) return;
      if(normalizedTitle.indexOf(term) > 0) {
        flagged = true;
      }
    });
  });
  if(flagged) {
    console.log(chalk.red(title));
  } else {
    console.log(title);
  }
}

function getPage(num, next) {
  console.log(chalk.green.bold('Getting page...'));
  if(next) {
    var url = next;
  } else {
    var url = `${PAGE_URL}/${num}/`;
  }
  request(url, function(error, response, body) {
    if(!(response.statusCode === 200) || error) return process.exit(1);
    if(body === []) terminateScrape(0); // Exhausted all articles
    getArticles(body);
  });
}

function getArticles(body) {
  var $ = cheerio.load(body);
  var articleList = $('article');
  var articles = [];
  for(var i = 0; i < articleList.length; i++) {
    $ = cheerio.load($(articleList[i]).html());
    var article = {};

    // Get image url
    try {
      var img = ($('img')[0].attribs.src);
    } catch(e) {
      img = null;
    } finally {
      article.img = img;
    }

    
    article.link = $('a')[0].attribs.href;

    // Get date
    try {
      var date = $('.byline')[1].children[0].data;
      if(!date || date === '') {
        throw new Error();
      }
    } catch(e) {
      article.date = article.link.match(/\d{4}\/\d{2}\/\d{2}/g);
    } finally {
      article.date = new Date (date);
    }

    // Get title
    article.title = $('h2').text();

    articles.push(article);

    
}

  // Get url of next page from pagination link
  var nextUrl = getNextPageUrl(body);
  articles.forEach(function(article) {
    // Analyze headlines and log to console
    logOutput(article.title);
  });
  
  // Save page articles to database
  Article.create(articles, function(err, res) {
    if(err) return handleError(err);
    console.log(chalk.green.bold('Successfully inserted into db.'));
    if(typeof nextUrl === 'string' && (nextUrl.indexOf('.com') > 0)) {
      console.log(chalk.green('Fetching next URL:'), nextUrl);
      getPage(null, nextUrl);
    } else {
      terminateScrape(1); // Exit on database error
    }
  });
}

function getNextPageUrl(body) {
  var $ = cheerio.load(body);
  var elem = $('.pagination a');
  return $(elem)[0].attribs.href;
}

function initiateScrape(page) {
  if(!page) {
    var page = 1; // If no start page specified, use first page
  }
  getPage(page);
}

function terminateScrape(code) {
  if(!code) {
    console.log(chalk.green.bold('Shutting down program...'));
    process.exit(); // Terminate w/o error
  }
  console.log(chalk.red.bold('Terminating on error...'));
  process.exit(1);
}

function handleError(err, callback, terminate) {
  console.error(chalk.red(err))
  if(terminate) terminateScrape(1);
  if(callback) callback(err, null);
  return;
}

