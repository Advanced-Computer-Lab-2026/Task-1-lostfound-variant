import mongoose from 'mongoose';

// TODO: define the Item schema per README.md section 1.

const itemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    category: {
      type: String,
      enum: ['Electronics', 'Clothing', 'Documents', 'Accesories', 'Other'],
      default: ['Other']
    },
    status: {
      type: String,
      enum: ['Lost', 'Found', 'Claimed'],
      default: ['Lost']
    },
    location: {
      type: String,
      required: false
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false

    }
  },
  { timestamps: true }
);

// TODO: add the uniqueness constraint described in README.md section 1.
itemSchema.index({ title: 1, location: 1 }, { unique: true });

export const Item = mongoose.model('Item', itemSchema);
