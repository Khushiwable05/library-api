const express = require('express');
const router = express.Router();
const {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  getAuthorBooks,
  updateAuthor,
  deleteAuthor,
} = require('../controllers/authorController');

router.route('/')
  .post(createAuthor)
  .get(getAllAuthors);

router.route('/:id')
  .get(getAuthorById)
  .put(updateAuthor)
  .delete(deleteAuthor);

router.route('/:id/books')
  .get(getAuthorBooks);

module.exports = router;
