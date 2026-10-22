# Library Book Management REST API

A production-ready RESTful API for managing authors and library books built using **Node.js**, **Express.js**, **MongoDB**, and **Mongoose** following the **MVC (Model-View-Controller)** architectural pattern.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture and Design](#architecture-and-design)
4. [Folder Structure](#folder-structure)
5. [Prerequisites](#prerequisites)
6. [Installation & Setup](#installation--setup)
7. [Environment Variables](#environment-variables)
8. [Running the Application](#running-the-application)
9. [Running Automated Tests](#running-automated-tests)
10. [Author-to-Book Relationship](#author-to-book-relationship)
11. [API Documentation & Endpoints](#api-documentation--endpoints)
    - [Author Endpoints](#author-endpoints)
    - [Book Endpoints](#book-endpoints)
12. [Postman Setup & Testing Guide](#postman-setup--testing-guide)
13. [How to Publish Postman Documentation](#how-to-publish-postman-documentation)
14. [Git Commit History](#git-commit-history)

---

## Project Overview

The **Library Book Management API** allows library staff to maintain an inventory of authors and books. Staff can create author profiles, catalog books linked to those authors, search and filter books by genre, availability, author, or title, and delete records while preserving database integrity.

### Key Capabilities
- **Strict Data Validation**: Validates name length, email regex, numeric published year boundaries, and restricted genres.
- **Referential Integrity**: Books strictly require an existing author reference; authors cannot be deleted if they have books in the catalog.
- **Advanced Querying**: Search by title substring (case-insensitive), filter by genre, author ObjectId, or availability flag.
- **Population**: Seamlessly hydrates author details inside book payloads using Mongoose `.populate('author')`.
- **Standardized Error Handling**: Uniform JSON response structures with precise HTTP status codes (`200`, `201`, `400`, `404`, `409`, `500`).

---

## Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (v4.x)
- **Database**: MongoDB (Local or Atlas)
- **ODM**: Mongoose (v8.x)
- **Environment**: Dotenv
- **API Testing**: Postman Collection (v2.1.0) & Node native test suite
- **Version Control**: Git & GitHub

---

## Architecture and Design

The application follows the MVC pattern (backend API variant without views):
- `models/`: Defines Mongoose schemas, constraints, indexes, and custom validation rules.
- `controllers/`: Houses business logic, relational integrity checks, and handles request/response flows.
- `routes/`: Maps REST endpoints to corresponding controller functions.
- `middleware/`: Provides centralized error trapping and catches unhandled routes (404).
- `config/`: Database connection configuration and lifecycle management.

---

## Folder Structure

```text
library-api/
├── config/
│   └── db.js                              # Mongoose connection setup
├── controllers/
│   ├── authorController.js               # Author business logic & validations
│   └── bookController.js                 # Book business logic, filtering & search
├── middleware/
│   ├── errorMiddleware.js                # Centralized error handler
│   └── notFoundMiddleware.js             # 404 Not Found route handler
├── models/
│   ├── Author.js                         # Author Mongoose schema
│   └── Book.js                           # Book Mongoose schema with enum & year rules
├── postman/
│   ├── Library_Book_API.postman_collection.json    # Full Postman v2.1 collection
│   └── Library_Book_API.postman_environment.json   # Environment variables (baseUrl, authorId)
├── routes/
│   ├── authorRoutes.js                   # /api/authors routes
│   └── bookRoutes.js                     # /api/books routes
├── tests/
│   └── api.test.js                       # Comprehensive automated integration test suite
├── .env.example                          # Environment template
├── .gitignore                            # Excludes node_modules, .env, logs
├── package.json                          # Dependencies and scripts
├── server.js                             # Express entry point
└── README.md                             # Complete project documentation
```

---

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **MongoDB**: A running local MongoDB instance on `127.0.0.1:27017` or a remote MongoDB Atlas connection URI

---

## Installation & Setup

1. Clone or navigate into the repository:
   ```bash
   cd library-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the environment configuration:
   ```bash
   cp .env.example .env
   ```

---

## Environment Variables

Edit `.env` with your configuration:

| Variable | Description | Default Value |
|---|---|---|
| `PORT` | Port the Express server listens on | `5000` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/library_db` |
| `NODE_ENV` | Application environment (development/production) | `development` |

---

## Running the Application

### Development Mode (with hot-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server will be running at: `http://localhost:5000`

---

## Running Automated Tests

Run the built-in end-to-end integration test suite against the local database:

```bash
npm test
```

The test runner executes 55 automated assertions covering:
- All CRUD operations on Authors and Books
- Validation errors (missing fields, short names, invalid email format, invalid ObjectId)
- Duplicate ISBN and duplicate Author email handling (409)
- Relational integrity: preventing deletion of authors who still have books (409)
- Query filtering by genre, availability, author ID, and case-insensitive search
- Population of author documents within book responses

---

## Author-to-Book Relationship

The system enforces a **One-to-Many** relationship between Authors and Books:
1. **Schema Reference**: Each Book document stores an `author` field referencing the Author collection via `mongoose.Schema.Types.ObjectId` with `ref: 'Author'`.
2. **Existence Check**: When creating or updating a book, the API checks whether the specified `author` ID exists in the database. If not, it returns `404 Author not found`.
3. **Population**: Responses for `GET /api/books`, `GET /api/books/:id`, and `GET /api/authors/:id/books` use Mongoose `.populate('author')` to replace the author ID with the full author object.
4. **Deletion Integrity**: An author **cannot be deleted** if there are books associated with their ID. Attempting to delete an author with books results in HTTP `409 Conflict` with the message:
   ```json
   {
     "success": false,
     "message": "Cannot delete this author because they still have books"
   }
   ```
   All associated books must be deleted before the author record can be safely removed.

---

## API Documentation & Endpoints

### Summary of Endpoints

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/authors` | Create an author | `201`, `400`, `409` |
| `GET` | `/api/authors` | Get all authors | `200` |
| `GET` | `/api/authors/:id` | Get single author | `200`, `400`, `404` |
| `GET` | `/api/authors/:id/books` | Get all books of an author | `200`, `400`, `404` |
| `PUT` | `/api/authors/:id` | Update an author | `200`, `400`, `404`, `409` |
| `DELETE` | `/api/authors/:id` | Delete an author (if no books) | `200`, `400`, `404`, `409` |
| `POST` | `/api/books` | Create a book | `201`, `400`, `404`, `409` |
| `GET` | `/api/books` | Get all books (with filters) | `200`, `400` |
| `GET` | `/api/books/:id` | Get single book | `200`, `400`, `404` |
| `PUT` | `/api/books/:id` | Update a book | `200`, `400`, `404`, `409` |
| `DELETE` | `/api/books/:id` | Delete a book | `200`, `400`, `404` |

---

### Author Endpoints

#### 1. Create Author
- **URL**: `POST /api/authors`
- **Request Body**:
  ```json
  {
    "name": "George Orwell",
    "email": "george.orwell@example.com",
    "country": "United Kingdom",
    "bio": "English novelist and essayist."
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Author created successfully",
    "data": {
      "_id": "67b8480f2d93e9514781ab01",
      "name": "George Orwell",
      "email": "george.orwell@example.com",
      "country": "United Kingdom",
      "bio": "English novelist and essayist.",
      "createdAt": "2026-10-22T14:30:00.000Z",
      "updatedAt": "2026-10-22T14:30:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (missing name):
    ```json
    { "success": false, "message": "Author name is required" }
    ```
  - `400 Bad Request` (invalid email):
    ```json
    { "success": false, "message": "Please provide a valid email address" }
    ```
  - `409 Conflict` (duplicate email):
    ```json
    { "success": false, "message": "An author with this email already exists" }
    ```

#### 2. Get All Authors
- **URL**: `GET /api/authors`
- **Success Response (200 OK with data)**:
  ```json
  {
    "success": true,
    "message": "Authors retrieved successfully",
    "count": 1,
    "data": [
      {
        "_id": "67b8480f2d93e9514781ab01",
        "name": "George Orwell",
        "email": "george.orwell@example.com",
        "country": "United Kingdom",
        "bio": "English novelist and essayist."
      }
    ]
  }
  ```

#### 3. Get Single Author
- **URL**: `GET /api/authors/:id`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Author retrieved successfully",
    "data": {
      "_id": "67b8480f2d93e9514781ab01",
      "name": "George Orwell",
      "email": "george.orwell@example.com"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (invalid ObjectId):
    ```json
    { "success": false, "message": "Invalid author ID format" }
    ```
  - `404 Not Found`:
    ```json
    { "success": false, "message": "Author not found" }
    ```

#### 4. Get Books of an Author
- **URL**: `GET /api/authors/:id/books`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Books retrieved successfully",
    "count": 1,
    "data": [
      {
        "_id": "67b8480f2d93e9514781ac01",
        "title": "1984",
        "isbn": "978-0451524935",
        "genre": "Fiction",
        "publishedYear": 1949,
        "available": true,
        "author": {
          "_id": "67b8480f2d93e9514781ab01",
          "name": "George Orwell"
        }
      }
    ]
  }
  ```

#### 5. Update Author
- **URL**: `PUT /api/authors/:id`
- **Request Body**:
  ```json
  {
    "bio": "English novelist, essayist, and journalist."
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Author updated successfully",
    "data": {
      "_id": "67b8480f2d93e9514781ab01",
      "name": "George Orwell",
      "bio": "English novelist, essayist, and journalist."
    }
  }
  ```

#### 6. Delete Author
- **URL**: `DELETE /api/authors/:id`
- **Success Response (200 OK, author with no books)**:
  ```json
  {
    "success": true,
    "message": "Author deleted successfully",
    "data": null
  }
  ```
- **Error Response (409 Conflict, author has books)**:
  ```json
  {
    "success": false,
    "message": "Cannot delete this author because they still have books"
  }
  ```

---

### Book Endpoints

#### Allowed Genres
`Fiction`, `Non-Fiction`, `Science`, `History`, `Technology`, `Biography`, `Fantasy`, `Mystery`

#### 7. Create Book
- **URL**: `POST /api/books`
- **Request Body**:
  ```json
  {
    "title": "1984",
    "author": "67b8480f2d93e9514781ab01",
    "isbn": "978-0451524935",
    "genre": "Fiction",
    "publishedYear": 1949,
    "available": true
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Book created successfully",
    "data": {
      "_id": "67b8480f2d93e9514781ac01",
      "title": "1984",
      "author": {
        "_id": "67b8480f2d93e9514781ab01",
        "name": "George Orwell",
        "email": "george.orwell@example.com"
      },
      "isbn": "978-0451524935",
      "genre": "Fiction",
      "publishedYear": 1949,
      "available": true,
      "createdAt": "2026-10-22T14:35:00.000Z",
      "updatedAt": "2026-10-22T14:35:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` (missing title):
    ```json
    { "success": false, "message": "Book title is required" }
    ```
  - `400 Bad Request` (invalid author ID format):
    ```json
    { "success": false, "message": "Invalid author ID format" }
    ```
  - `404 Not Found` (referenced author does not exist):
    ```json
    { "success": false, "message": "Author not found" }
    ```
  - `409 Conflict` (duplicate ISBN):
    ```json
    { "success": false, "message": "A book with this ISBN already exists" }
    ```

#### 8. Get All Books (with Filters & Search)
- **URL**: `GET /api/books`
- **Supported Query Parameters**:
  - `genre`: Filter by genre string (e.g., `?genre=Fiction`)
  - `author`: Filter by Author ObjectId (e.g., `?author=67b8480f2d93e9514781ab01`)
  - `available`: Filter by availability boolean (e.g., `?available=true`)
  - `search`: Case-insensitive title search (e.g., `?search=animal`)
- **Combined Query Example**:
  `GET /api/books?genre=Fiction&available=true&search=1984`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Books retrieved successfully",
    "count": 1,
    "data": [
      {
        "_id": "67b8480f2d93e9514781ac01",
        "title": "1984",
        "author": {
          "_id": "67b8480f2d93e9514781ab01",
          "name": "George Orwell",
          "email": "george.orwell@example.com"
        },
        "isbn": "978-0451524935",
        "genre": "Fiction",
        "publishedYear": 1949,
        "available": true
      }
    ]
  }
  ```

#### 9. Get Single Book
- **URL**: `GET /api/books/:id`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Book retrieved successfully",
    "data": {
      "_id": "67b8480f2d93e9514781ac01",
      "title": "1984",
      "author": {
        "_id": "67b8480f2d93e9514781ab01",
        "name": "George Orwell"
      },
      "isbn": "978-0451524935",
      "genre": "Fiction",
      "publishedYear": 1949,
      "available": true
    }
  }
  ```

#### 10. Update Book
- **URL**: `PUT /api/books/:id`
- **Request Body**:
  ```json
  {
    "available": false
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Book updated successfully",
    "data": {
      "_id": "67b8480f2d93e9514781ac01",
      "title": "1984",
      "available": false
    }
  }
  ```

#### 11. Delete Book
- **URL**: `DELETE /api/books/:id`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Book deleted successfully",
    "data": null
  }
  ```

---

## Postman Setup & Testing Guide

### 1. Importing the Collection and Environment
1. Open Postman.
2. Click **Import** (top-left).
3. Select and import:
   - `postman/Library_Book_API.postman_collection.json`
   - `postman/Library_Book_API.postman_environment.json`
4. In the top-right environment dropdown, select **Library Book API - Local**.

### 2. Recommended Execution Order
1. **POST Create Author**: Run this first. The test script will automatically extract the created author's `_id` and store it in your `{{authorId}}` environment variable.
2. **GET Get All Authors** & **GET Single Author**: Verify retrieval.
3. **POST Create Book**: Uses `{{authorId}}` to associate the book with your created author.
4. **GET All Books**: Test queries (`?genre=Fiction`, `?available=true`, `?search=1984`).
5. **DELETE Author (Conflict)**: Try deleting the author while the book exists — confirms HTTP `409 Conflict`.
6. **DELETE Book**: Delete the book record.
7. **DELETE Author**: Retry deleting the author — confirms HTTP `200 OK`.

---

## How to Publish Postman Documentation

To generate a shareable public documentation link:
1. In Postman, locate the collection **Library Book API** in the left sidebar.
2. Click the three dots `...` next to the collection name.
3. Select **View documentation**.
4. In the top right corner of the documentation view, click **Publish**.
5. Select your active environment (**Library Book API - Local**) if prompted.
6. Click **Publish Collection**.
7. Copy the generated public link and include it in your submission.

---

## Git Commit History

The repository has been initialized with clean, atomic commits:
1. `chore: initialize project with package.json, gitignore, and env example`
2. `feat: add database configuration module with Mongoose`
3. `feat: define Author and Book Mongoose schemas with validation`
4. `feat: implement centralized error handling and not found middleware`
5. `feat: implement Author controllers and routes with book dependency check`
6. `feat: implement Book controllers, routes, filters, search, and author population`
7. `test: add comprehensive automated API integration test suite`
8. `docs: add Postman collection, environment, and complete README documentation`
