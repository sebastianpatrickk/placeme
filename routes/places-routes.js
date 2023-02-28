const express = require('express');
const { check } = require('express-validator');
const upload = require('../middleware/file-upload');

const placesControllers = require('../controllers/places-controllers');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', placesControllers.getPlaces);

router.get('/:pid', placesControllers.getPlaceById);

router.get('/user/:uid', placesControllers.getPlacesByUserId);

router.use(auth);

router.post(
  '/',
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
    check('lat').not().isEmpty(),
    check('lng').not().isEmpty(),
    check('image').not().isEmpty(),
  ],
  placesControllers.createPlace
);

router.patch(
  '/:pid',
  check('title').not().isEmpty(),
  check('description').isLength({ min: 5 }),
  check('lat').not().isEmpty(),
  check('lng').not().isEmpty(),
  check('image').not().isEmpty(),
  placesControllers.updatePlace
);

router.delete('/:pid', placesControllers.deletePlace);

module.exports = router;
