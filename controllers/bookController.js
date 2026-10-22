const mongoose = require('mongoose');
const Book = require('../models/Book');
const Author = require('../models/Author');

const currentYear = new Date().getFullYear();

// POST /api/books
const createBook = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const { title, author, isbn, genre, publishedYear, available } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Book title is required',
      });
    }

    if (!author) {
      return res.status(400).json({
        success: false,
        message: 'Author reference is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(author)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author ID format',
      });
    }

    // Verify author exists in database
    const existingAuthor = await Author.findById(author);
    if (!existingAuthor) {
      return res.status(404).json({
        success: false,
        message: 'Author not found',
      });
    }

    if (!isbn || typeof isbn !== 'string' || isbn.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ISBN is required',
      });
    }

    // Check duplicate ISBN
    const existingBook = await Book.findOne({ isbn: isbn.trim() });
    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: 'A book with this ISBN already exists',
      });
    }

    if (!genre || typeof genre !== 'string' || genre.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Genre is required',
      });
    }

    if (!Book.allowedGenres.includes(genre.trim())) {
      return res.status(400).json({
        success: false,
        message: `Genre must be one of: ${Book.allowedGenres.join(', ')}`,
      });
    }

    if (publishedYear === undefined || publishedYear === null || publishedYear === '') {
      return res.status(400).json({
        success: false,
        message: 'Published year is required',
      });
    }

    const yearNum = Number(publishedYear);
    if (isNaN(yearNum) || yearNum < 1000 || yearNum > currentYear) {
      return res.status(400).json({
        success: false,
        message: `Published year must be a number between 1000 and ${currentYear}`,
      });
    }

    const book = await Book.create({
      title: title.trim(),
      author,
      isbn: isbn.trim(),
      genre: genre.trim(),
      publishedYear: yearNum,
      available: available !== undefined ? Boolean(available) : true,
    });

    const populatedBook = await Book.findById(book._id).populate('author');

    return res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: populatedBook,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/books
const getAllBooks = async (req, res, next) => {
  try {
    const { genre, author, available, search } = req.query;
    const query = {};

    if (genre) {
      query.genre = { $regex: new RegExp(`^${genre.trim()}$`, 'i') };
    }

    if (author) {
      if (!mongoose.Types.ObjectId.isValid(author)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid author ID format',
        });
      }
      query.author = author;
    }

    if (available !== undefined) {
      if (available === 'true' || available === true) {
        query.available = true;
      } else if (available === 'false' || available === false) {
        query.available = false;
      }
    }

    if (search && search.trim().length > 0) {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    const books = await Book.find(query).populate('author').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Books retrieved successfully',
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:id
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format',
      });
    }

    const book = await Book.findById(id).populate('author');

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Book retrieved successfully',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/books/:id
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format',
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    const { title, author, isbn, genre, publishedYear, available } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Book title cannot be empty',
        });
      }
      book.title = title.trim();
    }

    if (author !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(author)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid author ID format',
        });
      }

      const existingAuthor = await Author.findById(author);
      if (!existingAuthor) {
        return res.status(404).json({
          success: false,
          message: 'Author not found',
        });
      }
      book.author = author;
    }

    if (isbn !== undefined) {
      if (typeof isbn !== 'string' || isbn.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ISBN cannot be empty',
        });
      }

      const duplicate = await Book.findOne({
        _id: { $ne: id },
        isbn: isbn.trim(),
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'A book with this ISBN already exists',
        });
      }

      book.isbn = isbn.trim();
    }

    if (genre !== undefined) {
      if (typeof genre !== 'string' || !Book.allowedGenres.includes(genre.trim())) {
        return res.status(400).json({
          success: false,
          message: `Genre must be one of: ${Book.allowedGenres.join(', ')}`,
        });
      }
      book.genre = genre.trim();
    }

    if (publishedYear !== undefined) {
      const yearNum = Number(publishedYear);
      if (isNaN(yearNum) || yearNum < 1000 || yearNum > currentYear) {
        return res.status(400).json({
          success: false,
          message: `Published year must be a number between 1000 and ${currentYear}`,
        });
      }
      book.publishedYear = yearNum;
    }

    if (available !== undefined) {
      book.available = Boolean(available);
    }

    await book.save();
    const updatedBook = await Book.findById(id).populate('author');

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/books/:id
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID format',
      });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found',
      });
    }

    await Book.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
};
