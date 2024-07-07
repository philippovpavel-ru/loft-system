const jwt = require('jsonwebtoken');
const _ = require('lodash');
const helper = require('./../helpers/serialize');
const models = require('./../models');
require('dotenv').config();

const SECRET = process.env.SECRET;

const signToken = (userId, expiresIn = '10m') => {
  return jwt.sign({ user: { id: userId } }, SECRET, { expiresIn });
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

const calculateExpiryTime = (exp) => exp * 1000;

const createTokens = async (user) => {
  const userId = user.id;
  const accessToken = signToken(userId);
  const refreshToken = signToken(userId);

  const verifyToken = decodeToken(accessToken);
  const verifyRefresh = decodeToken(refreshToken);

  const accessTokenExpiredAt = calculateExpiryTime(verifyToken.exp);
  const refreshTokenExpiredAt = calculateExpiryTime(verifyRefresh.exp);

  await models.updateUser(userId, {
    accessToken,
    refreshToken,
    accessTokenExpiredAt,
    refreshTokenExpiredAt,
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiredAt,
    refreshTokenExpiredAt,
  };
};

const getUserByToken = async (token) => {
  try {
    const { user: { id: userId } } = jwt.verify(token, SECRET);
    return await models.getUserById(userId);
  } catch (err) {
    return null;
  }
};

const refreshTokens = async (refreshToken) => {
  const user = await getUserByToken(refreshToken);
  if (user && user.refreshToken === refreshToken) {
    const tokens = await createTokens(user);
    return {
      ...helper.serializeUser(user),
      ...tokens,
    };
  }
  return {};
};

module.exports = {
  createTokens,
  refreshTokens,
  getUserByToken,
};
