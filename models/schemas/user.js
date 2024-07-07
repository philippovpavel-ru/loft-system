const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const permissionSchema = new Schema({
  C: { type: Boolean, default: false },
  R: { type: Boolean, default: false },
  U: { type: Boolean, default: false },
  D: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new Schema(
  {
    firstName: { type: String },
    middleName: { type: String },
    surName: { type: String },
    image: { type: String },
    username: {
      type: String,
      required: [true, 'Username required'],
      unique: true
    },
    permission: {
      chat: { type: permissionSchema, default: () => ({}) },
      news: { type: permissionSchema, default: () => ({}) },
      settings: { type: permissionSchema, default: () => ({}) }
    },
    hash: {
      type: String,
      required: [true, 'Password required']
    },
    accessToken: { type: String },
    refreshToken: { type: String },
    accessTokenExpiredAt: { type: Date },
    refreshTokenExpiredAt: { type: Date }
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

userSchema.methods.setPassword = function (password) {
  this.hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

userSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.hash);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
