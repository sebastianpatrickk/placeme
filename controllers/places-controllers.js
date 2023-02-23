const uuid = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const Place = require('../models/place');
const User = require('../models/user');
const mongoose = require('mongoose');

const getPlaces = async (req, res, next) => {
  const places = await Place.find();

  if (!places) {
    const error = new HttpError('Nebylo možné najít místo pro zadané ID.', 404);
    return next(error);
  }

  res.status(200).json({ places });
};

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      'Něco se pokazilo, nepodařilo se najít místo.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError('Nebylo možné najít místo pro zadané ID.', 404);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) }); // => { place } => { place: place }
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      'Načítání míst se nezdařilo, zkuste to prosím znovu později.',
      500
    );
    return next(error);
  }

  if (!places || places.length === 0) {
    return next(new HttpError('Nebylo možné najít místo pro zadané ID.', 404));
  }

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError(
        'Byly zadány neplatné údaje, zkontrolujte prosím svá data.',
        422
      )
    );
  }

  const { title, description, coords, creator } = req.body;

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      'Vytvoření místa se nezdařilo, zkuste to prosím znovu.',
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      'Nebylo možné najít uživatele pro zadané ID.',
      404
    );
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    coords,
    creatorName: user.name,
    creator,
    image: '/images/places/p2.jpg',
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Vytvoření místa se nezdařilo, zkuste to prosím znovu.',
      500
    );
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return new HttpError(
      'Byly zadány neplatné údaje, zkontrolujte prosím svá data.',
      422
    );
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      'Něco se pokazilo, místo nelze aktualizovat.',
      500
    );
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      'Něco se pokazilo, místo nelze aktualizovat.',
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Něco se pokazilo, místo se nepodařilo smazat.',
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError('Nepodařilo se najít místo pro toto ID.', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Něco se pokazilo, místo se nepodařilo smazat.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Smazané místo.' });
};

exports.getPlaces = getPlaces;
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
