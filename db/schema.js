const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var articleSchema = new Schema({
  title: String,
  date: Date,
  image: String,
  link: String
});

module.exports = {
  article: articleSchema
}
