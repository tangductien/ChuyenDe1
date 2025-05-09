const mysql = require('mysql2/promise'); 
const fs = require('fs');
const config = require('../loadENV');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ping thử để kiểm tra kết nối
(async () => {
    try {
        const connection = await db.getConnection();
        console.log('Đã kết nối thành công đến MySQL!');
        connection.release(); // Đừng quên release lại nha!
    } catch (err) {
        console.error('Không thể kết nối đến MySQL: ', err.message);
    }
})();

// Hàm đọc và thực thi script SQL (nếu cần)
function executeSQLScript(filePath) {
    const script = fs.readFileSync(filePath, 'utf8');
    const statements = script.split(';').filter(stmt => stmt.trim());
    statements.forEach(async statement => {
        try {
            await db.query(statement);
            console.log('Thực thi SQL thành công');
        } catch (err) {
            console.error('Lỗi khi thực thi câu lệnh SQL: ', err);
        }
    });
}

module.exports = db;
