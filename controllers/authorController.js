const mongoose = require('mongoose');
const Author = require('../models/Author');
const Book = require('../models/Book');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/authors
const createAuthor = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const { name, email, country, bio } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Author name is required',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Author name must be at least 2 characters long',
      });
    }

    if (email !== undefined && email !== null && email.trim() !== '') {
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address',
        });
      }

      const existingAuthor = await Author.findOne({ email: email.trim().toLowerCase() });
      if (existingAuthor) {
        return res.status(409).json({
          success: false,
          message: 'An author with this email already exists',
        });
      }
    }

    const authorData = {
      name: name.trim(),
      country: country ? country.trim() : '',
      bio: bio ? bio.trim() : '',
    };

    if (email && email.trim() !== '') {
      authorData.email = email.trim().toLowerCase();
    }

    const author = await Author.create(authorData);

    return res.status(201).json({
      success: true,
      message: 'Author created successfully',
      data: author,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/authors
const getAllAuthors = async (req, res, next) => {
  try {
    const authors = await Author.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Authors retrieved successfully',
      count: authors.length,
      data: authors,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/authors/:id
const getAuthorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author ID format',
      });
    }

    const author = await Author.findById(id);

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Author retrieved successfully',
      data: author,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/authors/:id/books
const getAuthorBooks = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author ID format',
      });
    }

    const author = await Author.findById(id);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found',
      });
    }

    const books = await Book.find({ author: id }).populate('author').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: books.length > 0 ? 'Books retrieved successfully' : 'Author has no books',
      count: books.length,
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/authors/:id
const updateAuthor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author ID format',
      });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body cannot be empty',
      });
    }

    const author = await Author.findById(id);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found',
      });
    }

    const { name, email, country, bio } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Author name must be at least 2 characters long',
        });
      }
      author.name = name.trim();
    }

    if (email !== undefined) {
      if (email !== null && email.trim() !== '') {
        if (!emailRegex.test(email.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address',
          });
        }

        const duplicate = await Author.findOne({
          _id: { $ne: id },
          email: email.trim().toLowerCase(),
        });

        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: 'An author with this email already exists',
          });
        }

        author.email = email.trim().toLowerCase();
      } else {
        author.email = undefined;
      }
    }

    if (country !== undefined) {
      author.country = typeof country === 'string' ? country.trim() : '';
    }

    if (bio !== undefined) {
      author.bio = typeof bio === 'string' ? bio.trim() : '';
    }

    const updatedAuthor = await author.save();

    return res.status(200).json({
      success: true,
      message: 'Author updated successfully',
      data: updatedAuthor,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/authors/:id
const deleteAuthor = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid author ID format',
      });
    }

    const author = await Author.findById(id);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found',
      });
    }

    const bookCount = await Book.countDocuments({ author: id });
    if (bookCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete this author because they still have books',
      });
    }

    await Author.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Author deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  getAuthorBooks,
  updateAuthor,
  deleteAuthor,
};
