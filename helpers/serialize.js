const db = require('./../models');

/**
 * Сериализует объект пользователя.
 * 
 * @param {Object} user - Объект пользователя для сериализации.
 * @returns {Object} Сериализованный объект пользователя.
 */
module.exports.serializeUser = (user) => {
  return {
    firstName: user.firstName,
    id: user._id,
    image: user.image,
    middleName: user.middleName,
    permission: user.permission,
    surName: user.surName,
    username: user.username,
  };
};

/**
 * Сериализует объект новости.
 * 
 * @param {Object} news - Объект новости для сериализации.
 * @returns {Object} Сериализованный объект новости с данными пользователя.
 */
module.exports.serializeNews = async (news) => {
  try {
    const user = await db.getUserById(news.user);

    return {
      id: news._id,
      title: news.title,
      text: news.text,
      created_at: news.created_at,
      user: {
        firstName: user.firstName,
        image: user.image,
        middleName: user.middleName,
        surName: user.surName,
        username: user.username,
        id: user._id // _id для согласованности
      }
    };
  } catch (error) {
    console.error('Ошибка при сериализации новости:', error);
    throw error;
  }
};
