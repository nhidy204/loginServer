const { Sequelize } = require('sequelize');
const path = require('path');
const config = require('./environment');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite connected');
    
    // Sync models with database (create tables if not exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
  } catch (err) {
    console.error('❌ SQLite connection error:', err);
    process.exit(1);
  }
};

module.exports = { connectDB, sequelize };