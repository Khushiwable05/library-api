const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('../server');
const Author = require('../models/Author');
const Book = require('../models/Book');

dotenv.config();

const PORT = 5555;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let server;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const fetchOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  if (options.body) {
    fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  return {
    status: res.status,
    headers: res.headers,
    data,
  };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=============================================');
  console.log(' Starting Library Book Management API Tests ');
  console.log('=============================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library_db_test';
  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB for testing: ${mongoUri}`);

  // Clear previous test data
  await Book.deleteMany({});
  await Author.deleteMany({});
  console.log('Cleaned test database collections.\n');

  server = app.listen(PORT);

  try {
    // 1. Health check & 404 Route
    console.log('--- Server & Route Checks ---');
    let res = await request('/');
    assert(res.status === 200 && res.data.success === true, 'GET / returns 200 and success status');

    res = await request('/api/nonexistent');
    assert(res.status === 404 && res.data.success === false, 'GET /api/nonexistent returns 404 Route not found');

    // 2. Author API - Initial Empty State
    console.log('\n--- Author API: Empty State ---');
    res = await request('/api/authors');
    assert(res.status === 200 && res.data.count === 0 && Array.isArray(res.data.data), 'GET /api/authors returns 200 empty array when no authors');

    // 3. Author API - Validation Failures
    console.log('\n--- Author API: Validations on POST ---');
    res = await request('/api/authors', { method: 'POST', body: {} });
    assert(res.status === 400 && res.data.success === false, 'POST /api/authors with empty body returns 400');

    res = await request('/api/authors', { method: 'POST', body: { email: 'author@test.com' } });
    assert(res.status === 400 && res.data.message.includes('required'), 'POST /api/authors missing name returns 400');

    res = await request('/api/authors', { method: 'POST', body: { name: 'A' } });
    assert(res.status === 400 && res.data.message.includes('at least 2 characters'), 'POST /api/authors name < 2 chars returns 400');

    res = await request('/api/authors', { method: 'POST', body: { name: 'Arthur', email: 'invalid-email-format' } });
    assert(res.status === 400 && res.data.message.includes('valid email'), 'POST /api/authors invalid email returns 400');

    // 4. Author API - Successful Creation
    console.log('\n--- Author API: Successful Creation ---');
    res = await request('/api/authors', {
      method: 'POST',
      body: {
        name: 'George Orwell',
        email: 'george.orwell@example.com',
        country: 'United Kingdom',
        bio: 'English novelist and essayist.',
      },
    });
    assert(res.status === 201 && res.data.success === true && res.data.data._id, 'POST /api/authors creates Author 1 and returns 201');
    const author1Id = res.data.data._id;

    // Duplicate email
    res = await request('/api/authors', {
      method: 'POST',
      body: {
        name: 'Another Orwell',
        email: 'george.orwell@example.com',
      },
    });
    assert(res.status === 409 && res.data.success === false, 'POST /api/authors with duplicate email returns 409');

    // Author 2 without email
    res = await request('/api/authors', {
      method: 'POST',
      body: {
        name: 'Jane Austen',
        country: 'United Kingdom',
        bio: 'English novelist known for Romantic fiction.',
      },
    });
    assert(res.status === 201 && res.data.success === true, 'POST /api/authors creates Author 2 (optional email omitted) and returns 201');
    const author2Id = res.data.data._id;

    // 5. Author API - Retrieval
    console.log('\n--- Author API: Retrieval ---');
    res = await request('/api/authors');
    assert(res.status === 200 && res.data.count === 2, 'GET /api/authors returns 200 with 2 authors');

    res = await request('/api/authors/invalid-id');
    assert(res.status === 400 && res.data.message.includes('Invalid author ID format'), 'GET /api/authors/:id invalid ID returns 400');

    const fakeObjectId = new mongoose.Types.ObjectId();
    res = await request(`/api/authors/${fakeObjectId}`);
    assert(res.status === 404 && res.data.message.includes('Author not found'), 'GET /api/authors/:id non-existent ID returns 404');

    res = await request(`/api/authors/${author1Id}`);
    assert(res.status === 200 && res.data.data.name === 'George Orwell', 'GET /api/authors/:id returns 200 and author details');

    // 6. Author Books - Empty Books
    console.log('\n--- Author API: Author Books (Empty) ---');
    res = await request(`/api/authors/${author1Id}/books`);
    assert(res.status === 200 && res.data.count === 0, 'GET /api/authors/:id/books returns 200 with count 0 when author has no books');

    res = await request(`/api/authors/${fakeObjectId}/books`);
    assert(res.status === 404 && res.data.message.includes('Author not found'), 'GET /api/authors/:id/books with non-existent author returns 404');

    // 7. Book API - Initial Empty State
    console.log('\n--- Book API: Empty State ---');
    res = await request('/api/books');
    assert(res.status === 200 && res.data.count === 0, 'GET /api/books returns 200 empty array when no books');

    // 8. Book API - Validation Failures
    console.log('\n--- Book API: Validations on POST ---');
    res = await request('/api/books', { method: 'POST', body: {} });
    assert(res.status === 400 && res.data.success === false, 'POST /api/books empty body returns 400');

    res = await request('/api/books', {
      method: 'POST',
      body: { author: author1Id, isbn: '978-0451524935', genre: 'Fiction', publishedYear: 1949 },
    });
    assert(res.status === 400 && res.data.message.includes('title is required'), 'POST /api/books missing title returns 400');

    res = await request('/api/books', {
      method: 'POST',
      body: { title: '1984', isbn: '978-0451524935', genre: 'Fiction', publishedYear: 1949 },
    });
    assert(res.status === 400 && res.data.message.includes('Author reference is required'), 'POST /api/books missing author returns 400');

    res = await request('/api/books', {
      method: 'POST',
      body: { title: '1984', author: 'invalid-id', isbn: '978-0451524935', genre: 'Fiction', publishedYear: 1949 },
    });
    assert(res.status === 400 && res.data.message.includes('Invalid author ID format'), 'POST /api/books invalid author ID returns 400');

    res = await request('/api/books', {
      method: 'POST',
      body: { title: '1984', author: fakeObjectId, isbn: '978-0451524935', genre: 'Fiction', publishedYear: 1949 },
    });
    assert(res.status === 404 && res.data.message.includes('Author not found'), 'POST /api/books with non-existent author returns 404');

    res = await request('/api/books', {
      method: 'POST',
      body: { title: '1984', author: author1Id, isbn: '978-0451524935', genre: 'Cooking', publishedYear: 1949 },
    });
    assert(res.status === 400 && res.data.message.includes('Genre must be one of'), 'POST /api/books with unallowed genre returns 400');

    res = await request('/api/books', {
      method: 'POST',
      body: { title: '1984', author: author1Id, isbn: '978-0451524935', genre: 'Fiction', publishedYear: 999 },
    });
    assert(res.status === 400 && res.data.message.includes('Published year must be a number between 1000'), 'POST /api/books publishedYear < 1000 returns 400');

    res = await request('/api/books', {
      method: 'POST',
      body: { title: '1984', author: author1Id, isbn: '978-0451524935', genre: 'Fiction', publishedYear: 2999 },
    });
    assert(res.status === 400 && res.data.message.includes('Published year must be a number between 1000'), 'POST /api/books publishedYear in the future returns 400');

    // 9. Book API - Successful Creation
    console.log('\n--- Book API: Successful Creation & Population ---');
    res = await request('/api/books', {
      method: 'POST',
      body: {
        title: '1984',
        author: author1Id,
        isbn: '978-0451524935',
        genre: 'Fiction',
        publishedYear: 1949,
        available: true,
      },
    });
    assert(
      res.status === 201 &&
      res.data.success === true &&
      res.data.data.title === '1984' &&
      res.data.data.author.name === 'George Orwell',
      'POST /api/books creates book 1 and returns 201 with populated author'
    );
    const book1Id = res.data.data._id;

    // Duplicate ISBN
    res = await request('/api/books', {
      method: 'POST',
      body: {
        title: 'Nineteen Eighty-Four Duplicate',
        author: author1Id,
        isbn: '978-0451524935',
        genre: 'Fiction',
        publishedYear: 1949,
      },
    });
    assert(res.status === 409 && res.data.success === false, 'POST /api/books with duplicate ISBN returns 409');

    // Create Book 2
    res = await request('/api/books', {
      method: 'POST',
      body: {
        title: 'Animal Farm',
        author: author1Id,
        isbn: '978-0451526342',
        genre: 'Fiction',
        publishedYear: 1945,
        available: false,
      },
    });
    assert(res.status === 201 && res.data.data.title === 'Animal Farm', 'POST /api/books creates book 2 and returns 201');
    const book2Id = res.data.data._id;

    // 10. Book API - Get All & Filters
    console.log('\n--- Book API: Retrieval & Filters ---');
    res = await request('/api/books');
    assert(res.status === 200 && res.data.count === 2 && res.data.data[0].author.name === 'George Orwell', 'GET /api/books returns 200 with all books populated');

    // Filter by genre
    res = await request('/api/books?genre=Fiction');
    assert(res.status === 200 && res.data.count === 2, 'GET /api/books?genre=Fiction filters correctly');

    res = await request('/api/books?genre=Science');
    assert(res.status === 200 && res.data.count === 0, 'GET /api/books?genre=Science returns 200 with empty list');

    // Filter by author
    res = await request(`/api/books?author=${author1Id}`);
    assert(res.status === 200 && res.data.count === 2, 'GET /api/books?author=<id> returns author books');

    res = await request(`/api/books?author=${author2Id}`);
    assert(res.status === 200 && res.data.count === 0, 'GET /api/books?author=<id2> returns 200 with 0 books');

    // Filter by availability
    res = await request('/api/books?available=true');
    assert(res.status === 200 && res.data.count === 1 && res.data.data[0].title === '1984', 'GET /api/books?available=true returns available books');

    res = await request('/api/books?available=false');
    assert(res.status === 200 && res.data.count === 1 && res.data.data[0].title === 'Animal Farm', 'GET /api/books?available=false returns unavailable books');

    // Search by title
    res = await request('/api/books?search=animal');
    assert(res.status === 200 && res.data.count === 1 && res.data.data[0].title === 'Animal Farm', 'GET /api/books?search=animal case-insensitive title search');

    res = await request('/api/books?search=nonexistent');
    assert(res.status === 200 && res.data.count === 0, 'GET /api/books?search=nonexistent returns 200 with empty data');

    // 11. Book API - Get Single Book
    console.log('\n--- Book API: Single Book ---');
    res = await request('/api/books/invalid-id');
    assert(res.status === 400 && res.data.message.includes('Invalid book ID format'), 'GET /api/books/:id invalid ID returns 400');

    res = await request(`/api/books/${fakeObjectId}`);
    assert(res.status === 404 && res.data.message.includes('Book not found'), 'GET /api/books/:id non-existent ID returns 404');

    res = await request(`/api/books/${book1Id}`);
    assert(res.status === 200 && res.data.data.title === '1984' && res.data.data.author.name === 'George Orwell', 'GET /api/books/:id returns 200 with populated author');

    // 12. Author Books Endpoint
    console.log('\n--- Author API: Author Books with Data ---');
    res = await request(`/api/authors/${author1Id}/books`);
    assert(res.status === 200 && res.data.count === 2, 'GET /api/authors/:id/books returns books written by author');

    // 13. Author Update
    console.log('\n--- Author API: Update Author ---');
    res = await request(`/api/authors/${author1Id}`, {
      method: 'PUT',
      body: { bio: 'Renowned English novelist, essayist, and critic.' },
    });
    assert(res.status === 200 && res.data.data.bio.includes('critic'), 'PUT /api/authors/:id updates author bio');

    res = await request(`/api/authors/${author1Id}`, {
      method: 'PUT',
      body: {},
    });
    assert(res.status === 400 && res.data.message.includes('empty'), 'PUT /api/authors/:id empty body returns 400');

    res = await request(`/api/authors/${fakeObjectId}`, {
      method: 'PUT',
      body: { name: 'Nobody' },
    });
    assert(res.status === 404 && res.data.message.includes('Author not found'), 'PUT /api/authors/:id non-existent author returns 404');

    // 14. Book Update
    console.log('\n--- Book API: Update Book ---');
    res = await request(`/api/books/${book1Id}`, {
      method: 'PUT',
      body: { available: false },
    });
    assert(res.status === 200 && res.data.data.available === false, 'PUT /api/books/:id updates availability');

    res = await request(`/api/books/${book1Id}`, {
      method: 'PUT',
      body: { genre: 'InvalidGenre' },
    });
    assert(res.status === 400 && res.data.message.includes('Genre must be one of'), 'PUT /api/books/:id with invalid genre returns 400');

    res = await request(`/api/books/${book1Id}`, {
      method: 'PUT',
      body: { isbn: '978-0451526342' },
    });
    assert(res.status === 409 && res.data.message.includes('already exists'), 'PUT /api/books/:id with duplicate ISBN returns 409');

    // 15. Relationship Integrity - Prevent Deletion of Author with Books
    console.log('\n--- Relationship Integrity: Delete Author Conflict ---');
    res = await request(`/api/authors/${author1Id}`, { method: 'DELETE' });
    assert(
      res.status === 409 && res.data.message === 'Cannot delete this author because they still have books',
      'DELETE /api/authors/:id returns 409 when author still has books'
    );

    // 16. Delete Books
    console.log('\n--- Book API: Delete Book ---');
    res = await request(`/api/books/${book1Id}`, { method: 'DELETE' });
    assert(res.status === 200 && res.data.success === true, 'DELETE /api/books/:id deletes book 1 and returns 200');

    res = await request(`/api/books/${book1Id}`);
    assert(res.status === 404 && res.data.message.includes('Book not found'), 'GET /api/books/:id after deletion returns 404');

    res = await request(`/api/books/${book2Id}`, { method: 'DELETE' });
    assert(res.status === 200 && res.data.success === true, 'DELETE /api/books/:id deletes book 2 and returns 200');

    // 17. Delete Author after books are removed
    console.log('\n--- Author API: Delete Author (Now Empty) ---');
    res = await request(`/api/authors/${author1Id}`, { method: 'DELETE' });
    assert(res.status === 200 && res.data.success === true, 'DELETE /api/authors/:id returns 200 once author has no books');

    res = await request(`/api/authors/${author1Id}`);
    assert(res.status === 404 && res.data.message.includes('Author not found'), 'GET /api/authors/:id after deletion returns 404');

    // Delete Author 2 (had no books originally)
    res = await request(`/api/authors/${author2Id}`, { method: 'DELETE' });
    assert(res.status === 200 && res.data.success === true, 'DELETE /api/authors/:id author with no books returns 200');

    res = await request(`/api/authors/${author2Id}`, { method: 'DELETE' });
    assert(res.status === 404 && res.data.message.includes('Author not found'), 'DELETE /api/authors/:id again returns 404');

  } catch (err) {
    console.error('Unhandled test runner error:', err);
    failed++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();
  }

  console.log('\n=============================================');
  console.log(` Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
