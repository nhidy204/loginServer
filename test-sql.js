const sql = require('mssql');

const config = {
  server: 'localhost',
  database: 'login_server',
  user: 'sa', // hoặc để trống nếu dùng Windows Authentication
  password: 'your_password', // hoặc để trống nếu dùng Windows Authentication
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function testConnection() {
  try {
    console.log('🔍 Testing SQL Server connection...');
    await sql.connect(config);
    console.log('✅ SQL Server connected successfully!');
    
    const result = await sql.query('SELECT @@VERSION as version');
    console.log('📊 SQL Server version:', result.recordset[0].version);
    
    await sql.close();
  } catch (err) {
    console.error('❌ SQL Server connection failed:', err.message);
  }
}

testConnection(); 