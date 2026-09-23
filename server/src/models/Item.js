import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: ['electronics', 'clothing', 'documents', 'accessories', 'other'],
      default: 'other'
    },
    status: {
      type: String,
      enum: ['lost', 'found', 'claimed'],
      default: 'lost'
    },
    location: { type: String },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// "Same title reported twice at the same location" only makes sense once a
// location is actually given, so items with no location are excluded from
// the uniqueness check (otherwise every locationless item would collide on
// the same { title, location: undefined } pair after the first one).
itemSchema.index(
  { title: 1, location: 1 },
  { unique: true, partialFilterExpression: { location: { $type: 'string' } } }
);

export const Item = mongoose.model('Item', itemSchema);
