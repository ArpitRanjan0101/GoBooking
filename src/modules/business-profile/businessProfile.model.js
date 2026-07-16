const mongoose = require('mongoose');
const BUSINESS_TYPE = require('../../constants/businessType.constant');
const WORKING_DAYS = require('../../constants/workingDays.constant');

const businessProfileSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
    },
    business_name: { type: String, required: true, trim: true, maxlength: 150 },
    business_type: { type: String, enum: Object.values(BUSINESS_TYPE), required: true },
    description: { type: String, trim: true, default: null },
    logo_url: { type: String, default: null },
    cover_image_url: { type: String, default: null },
    address_line_1: { type: String, required: true, trim: true },
    address_line_2: { type: String, trim: true, default: null },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    postal_code: { type: String, required: true, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    working_days: {
      type: [String],
      enum: Object.values(WORKING_DAYS),
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'working_days must contain at least one day',
      },
    },
    open_time: { type: String, required: true },
    close_time: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

module.exports = mongoose.model('BusinessProfile', businessProfileSchema);
