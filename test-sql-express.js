const sql = require('mssql');

const configs = [
  {
    name: 'Default SQL Server',
    config: {
      server: 'localhost',
      database: 'master',
      user: 'sa',
      password: 'your_password',
      options: { encrypt: false, trustServerCertificate: true }
    }
  },
  {
    name: 'SQL Server Express',
    config: {
      server: 'localhost\\SQLEXPRESS',
      database: 'master',
      user: 'sa',
      password: 'your_password',
      options: { encrypt: false, trustServerCertificate: true }
    }
  },
  {
    name: 'Windows Authentication',
    config: {
      server: 'localhost',
      database: 'master',
      options: { 
        encrypt: false, 
        trustServerCertificate: true,
        integratedSecurity: true
      }
    }
  }
];

async function testConnections() {
  for (const test of configs) {
    try {
      console.log(`🔍 Testing ${test.name}...`);
      await sql.connect(test.config);
      console.log(`✅ ${test.name} connected successfully!`);
      
      const result = await sql.query('SELECT @@VERSION as version');
      console.log(`📊 ${test.name} version:`, result.recordset[0].version.substring(0, 50) + '...');
      
      await sql.close();
      console.log('---');
    } catch (err) {
      console.error(`❌ ${test.name} failed:`, err.message);
      console.log('---');
    }
  }
}

testConnections(); 