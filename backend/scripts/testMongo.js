const mongoose = require('mongoose');
require('dotenv').config();

const provided = 'mongodb+srv://antomelvin_db_user:9487868172@cluster0.9cgagff.mongodb.net/myDatabase';
const uri = process.env.MONGO_URI || provided;

console.log('Testing MongoDB URI:', uri.replace(/(mongodb\+srv:\/\/[^:]+:)[^@]+(@.*)/, '$1***$2'));

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connection successful');
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err && err.message ? err.message : err);
    process.exit(1);
  });
