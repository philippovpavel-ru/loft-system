const User = require('./schemas/user');
const News = require('./schemas/news');
const helper = require('./../helpers/serialize.js');
const db = require('./../models');

// User Services
module.exports.getUserByName = async (username) => {
   return User.findOne({ username });
};

module.exports.getUserById = async (id) => {
   return User.findById(id);
};

module.exports.getUsers = async () => {
   return User.find();
};

module.exports.createUser = async (data) => {
   const { username, surName, firstName, middleName, password } = data;
   const newUser = new User({
      username,
      surName,
      firstName,
      middleName,
      image: '',
      permission: {
         chat: { C: true, R: true, U: true, D: true },
         news: { C: true, R: true, U: true, D: true },
         settings: { C: true, R: true, U: true, D: true },
      },
      accessToken: '',
      refreshToken: '',
      accessTokenExpiredAt: '',
      refreshTokenExpiredAt: '',
   });

   newUser.setPassword(password);
   return newUser.save();
};

module.exports.updateUser = async (id, update) => {
   return User.findByIdAndUpdate(id, update, { new: true });
};

module.exports.deleteUser = async (id) => {
   return User.findByIdAndDelete(id);
};

// News Services
module.exports.getNews = async () => {
   return News.find();
};

module.exports.createNews = async (data, user) => {
   const { text, title } = data;
   const newNews = new News({
      text,
      title,
      user: user.id,
   });

   return newNews.save();
};

module.exports.deleteNews = async (id) => {
   return News.findByIdAndDelete(id);
};

module.exports.updateNews = async (id, update) => {
   return News.findByIdAndUpdate(id, update, { new: true });
};
