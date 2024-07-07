const express = require('express');
const router = express.Router();
const tokens = require('./../auth/tokens');
const passport = require('passport');
const db = require('./../models');
const helper = require('./../helpers/serialize');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Middleware для авторизации
const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        code: 401,
        message: 'Unauthorized',
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// Регистрация нового пользователя
router.post('/registration', async (req, res) => {
  const { username } = req.body;

  try {
    const existingUser = await db.getUserByName(username);
    if (existingUser) {
      return res.status(409).json({
        message: `Пользователь ${username} существует`,
      });
    }

    const newUser = await db.createUser(req.body);
    const token = await tokens.createTokens(newUser);

    res.json({
      ...helper.serializeUser(newUser),
      ...token,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка сервера: ' + e.message });
  }
});

// Авторизация пользователя
router.post('/login', async (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(400).json({ message: 'Неверный логин или пароль' });
    }

    try {
      const token = await tokens.createTokens(user);
      res.json({
        ...helper.serializeUser(user),
        ...token,
      });
    } catch (e) {
      next(e);
    }
  })(req, res, next);
});

// Обновление access-токена
router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.headers['authorization'];

  try {
    const data = await tokens.refreshTokens(refreshToken);
    res.json(data);
  } catch (e) {
    res.status(401).json({ message: 'Ошибка обновления токена: ' + e.message });
  }
});

// Получение информации о пользователе
router.get('/profile', auth, (req, res) => {
  res.json(helper.serializeUser(req.user));
});

// Обновление информации о пользователе
router.patch('/profile', auth, async (req, res, next) => {
  const userId = req.user.id;
  const form = new formidable.IncomingForm();
  const uploadDir = path.join(__dirname, '..', 'uploads', 'assets', 'img');
  form.uploadDir = uploadDir;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return next(err);
    }

    try {
      let imagePath = null;

      if (files.avatar) {
        const fileName = path.join(uploadDir, files.avatar.originalFilename);
        await fs.promises.rename(files.avatar.filepath, fileName);
        imagePath = path.join('assets', 'img', files.avatar.originalFilename);
      }

      const user = await db.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      if (fields.newPassword) {
        user.hash = bcrypt.hashSync(fields.newPassword, bcrypt.genSaltSync(10));
      }

      user.firstName = fields.firstName || user.firstName;
      user.middleName = fields.middleName || user.middleName;
      user.surName = fields.surName || user.surName;
      if (imagePath) {
        user.image = imagePath;
      }

      const updatedUser = await user.save();
      res.json(helper.serializeUser(updatedUser));
    } catch (err) {
      next(err);
    }
  });
});

// Получение списка новостей
router.get('/news', async (req, res) => {
  try {
    const newsItems = await db.getNews();
    const serializedNews = await Promise.all(newsItems.map(item => helper.serializeNews(item)));
    res.json(serializedNews);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения новостей: ' + error.message });
  }
});

// Создание новой новости
router.post('/news', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const newNews = await db.createNews(req.body, user);
    const allNews = await db.getNews();
    const serializedNews = await Promise.all(allNews.map(item => helper.serializeNews(item)));
    res.json(serializedNews);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка создания новости: ' + error.message });
  }
});

// Обновление существующей новости
router.patch('/news/:id', async (req, res) => {
  try {
    const updatedNews = await db.updateNews(req.params.id, {
      title: req.body.title,
      text: req.body.text,
    });

    const allNews = await db.getNews();
    const serializedNews = await Promise.all(allNews.map(item => helper.serializeNews(item)));
    res.json(serializedNews);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления новости: ' + error.message });
  }
});

// Удаление существующей новости
router.delete('/news/:id', async (req, res) => {
  try {
    await db.deleteNews(req.params.id);

    const allNews = await db.getNews();
    const serializedNews = await Promise.all(allNews.map(item => helper.serializeNews(item)));
    res.json(serializedNews);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления новости: ' + error.message });
  }
});

// Получение списка пользователей
router.get('/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    const serializedUsers = users.map(user => helper.serializeUser(user));
    res.json(serializedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения пользователей: ' + error.message });
  }
});

// Удаление пользователя
router.delete('/users/:id', async (req, res) => {
  try {
    await db.deleteUser(req.params.id);

    const users = await db.getUsers();
    const serializedUsers = users.map(user => helper.serializeUser(user));
    res.json(serializedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка удаления пользователя: ' + error.message });
  }
});

// Обновление разрешений пользователя
router.patch('/users/:id/permission', async (req, res) => {
  try {
    const updatedUser = await db.updateUser(req.params.id, {
      permission: req.body.permission,
    });

    const users = await db.getUsers();
    const serializedUsers = users.map(user => helper.serializeUser(user));
    res.json(serializedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления разрешений: ' + error.message });
  }
});

module.exports = router;
