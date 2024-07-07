const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.uriDb;

mongoose.Promise = global.Promise;
mongoose.set('strictQuery', true);

const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(uri, connectOptions);

mongoose.connection.on('connected', () => {
  console.log('Mongoose connection open');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Mongoose connection disconnected due to app termination');
    process.exit(1);
  });
});
