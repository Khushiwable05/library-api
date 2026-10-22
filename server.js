const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authorRoutes = require('./routes/authorRoutes');
const bookRoutes = require('./routes/bookRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');

dotenv.config();

const app = express();

// Body Parser Middleware
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Library Book Management API is running',
    version: '1.0.0',
    documentation: 'See postman/Library_Book_API.postman_collection.json',
  });
});

// API Routes
app.use('/api/authors', authorRoutes);
app.use('/api/books', bookRoutes);

// 404 Route Not Found Handler
app.use(notFoundMiddleware);

// Centralized Error Handling Middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  });
}

module.exports = app;
