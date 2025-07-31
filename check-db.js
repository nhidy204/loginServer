const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database structure and data...');
    
    // Kiểm tra kết nối
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Lấy thông tin bảng users
    const tableInfo = await sequelize.query("PRAGMA table_info(users);");
    console.log('\n📋 Table structure:');
    console.log(tableInfo[0]);
    
    // Lấy tất cả users
    const users = await User.findAll();
    console.log(`\n📊 Total users in database: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 User data:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password Hash: ${user.passwordHash.substring(0, 20)}...`);
        console.log(`   Reset Token: ${user.resetToken || 'null'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Updated: ${user.updatedAt}`);
        console.log('   ---');
      });
    } else {
      console.log('📭 No users found in database');
    }
    
    // Kiểm tra kích thước file database
    const fs = require('fs');
    const dbPath = './database.sqlite';
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log(`\n💾 Database file size: ${(stats.size / 1024).toFixed(2)} KB`);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase(); 