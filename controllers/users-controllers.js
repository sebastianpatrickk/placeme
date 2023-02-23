const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password -email');
  } catch (err) {
    const error = new HttpError(
      'Načítání uživatelů se nezdařilo, zkuste to prosím znovu později.',
      500
    );
    return next(error);
  }

  if (!users) {
    const error = new HttpError(
      'Načítání uživatelů se nezdařilo, zkuste to prosím znovu později.',
      200
    );
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        'Byly zadány neplatné údaje, zkontrolujte prosím svá data.',
        422
      )
    );
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Registrace se nezdařila, zkuste to prosím znovu později.',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'Uživatel již existuje, přihlaste se místo něj.',
      422
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image: '/images/users/u2.png',
    password,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Registrace se nezdařila, zkuste to prosím znovu.',
      500
    );
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Přihlášení se nezdařilo, zkuste to prosím znovu později.',
      500
    );
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError(
      'Neplatné přihlašovací údaje, nelze vás přihlásit.',
      401
    );
    return next(error);
  }

  res.json({ message: 'Přihlášen!' });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
