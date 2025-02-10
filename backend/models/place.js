const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const placeSchema = new Schema(
  {
    title: { type: String, require: true },
    description: { type: String, require: true },
    image: { type: String, require: true },
    coords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    creatorName: { type: String, required: true },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Place', placeSchema);
