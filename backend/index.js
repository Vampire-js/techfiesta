require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
.then(() => {
  console.log('Mongo connected');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => {
  console.error('DB connection error', err);
});
