const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password -email").sort({ createdAt: "desc" });
  } catch (err) {
    const error = new HttpError(
      "Načítání uživatelů se nezdařilo, zkuste to prosím znovu později.",
      500
    );
    return next(error);
  }

  if (!users) {
    const error = new HttpError(
      "Načítání uživatelů se nezdařilo, zkuste to prosím znovu později.",
      404
    );
  }

  // next(new HttpError('Test error', 404));

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        "Byly zadány neplatné údaje, zkontrolujte prosím svá data.",
        422
      )
    );
  }
  const { name, email, password, image } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Registrace se nezdařila, zkuste to prosím znovu později.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "Uživatel již existuje, přihlaste se místo něj.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Registrace se nezdařila, zkuste to prosím znovu.",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Registrace se nezdařila, zkuste to prosím znovu.",
      500
    );
    return next(error);
  }

  let token;

  try {
    token = jwt.sign(
      { id: createdUser.id, email: createdUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Registrace se nezdařila, zkuste to prosím znovu...",
      500
    );
    return next(error);
  }

  res.status(201).json({ id: createdUser.id, email: createdUser.email, token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Přihlášení se nezdařilo, zkuste to prosím znovu později.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Neplatné přihlašovací údaje, nelze vás přihlásit.",
      401
    );
    return next(error);
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError(
        "Přihlášení se nezdařilo, zkuste to prosím znovu později.",
        500
      )
    );
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Neplatné přihlašovací údaje, nelze vás přihlásit.",
      401
    );
    return next(error);
  }

  let token;

  try {
    token = jwt.sign(
      { id: existingUser.id, email: existingUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Neplatné přihlašovací údaje, nelze vás přihlásit.",
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ id: existingUser.id, email: existingUser.email, token });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
