const winston = require('winston');
const mongoose = require('mongoose');

module.exports = function() {
    // mongoose.connect('mongodb://admin:12345@ds139067.mlab.com:39067/vidly')
    mongoose.connect('mongodb://admin:admin123@ds023634.mlab.com:23634/exaride-dev-db')
    .then(() => winston.info('Connected to the database...'));
}