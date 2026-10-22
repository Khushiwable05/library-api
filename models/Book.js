const mongoose = require('mongoose');

const allowedGenres = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'History',
  'Technology',
  'Biography',
  'Fantasy',
  'Mystery',
];

const currentYear = new Date().getFullYear();

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Author reference is required'],
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      enum: {
        values: allowedGenres,
        message: `Genre must be one of: ${allowedGenres.join(', ')}`,
      },
      trim: true,
    },
    publishedYear: {
      type: Number,
      required: [true, 'Published year is required'],
      min: [1000, 'Published year must be at least 1000'],
      max: [currentYear, `Published year cannot exceed current year (${currentYear})`],
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

bookSchema.statics.allowedGenres = allowedGenres;

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
