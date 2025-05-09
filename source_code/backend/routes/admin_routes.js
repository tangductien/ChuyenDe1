const express = require('express');
const db = require('../config/db');
const router = express.Router();

// // Middleware kiểm tra admin (giả định)
// const isAdmin = (req, res, next) => {
//   // Giả định req.user đã được thiết lập từ middleware xác thực
//   if (req.user && req.user.role === 'admin') {
//     next();
//   } else {
//     res.status(403).json({ error: 'Chỉ admin mới có quyền truy cập!' });
//   }
// };

// // Áp dụng middleware cho tất cả các route
// router.use(isAdmin);

// Lấy danh sách hãng hàng không
router.get('/airlines', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, airline_name FROM airlines WHERE is_active = TRUE');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn hãng hàng không!' });
  }
});

// Lấy danh sách sân bay
router.get('/airports', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM airports');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn sân bay!' });
  }
});

// --- Quản lý chuyến bay ---

// Lấy danh sách chuyến bay
router.get('/flights', async (req, res) => {
  try {
    const { startDate, endDate, origin, destination, airline } = req.query;
    let query = `
      SELECT 
        f.id, f.flight_code, f.departure_time, f.arrival_time, f.price, f.total_seats,
        al.airline_name, al.id AS airline_id,
        origin_city.city_name AS origin_city, origin_airport.id AS origin_airport,
        dest_city.city_name AS destination_city, dest_airport.id AS destination_airport
      FROM flights f
      JOIN airlines al ON f.airline_id = al.id
      JOIN airports origin_airport ON f.origin_airport = origin_airport.id
      JOIN airports dest_airport ON f.destination_airport = dest_airport.id
      JOIN cities origin_city ON origin_airport.city_id = origin_city.id
      JOIN cities dest_city ON dest_airport.city_id = dest_city.id
      WHERE f.is_active = TRUE
    `;
    const params = [];

    if (startDate) {
      query += ' AND f.departure_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND f.departure_time <= ?';
      params.push(endDate);
    }
    if (origin) {
      query += ' AND f.origin_airport = ?';
      params.push(origin);
    }
    if (destination) {
      query += ' AND f.destination_airport = ?';
      params.push(destination);
    }
    if (airline) {
      query += ' AND f.airline_id = ?';
      params.push(airline);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn chuyến bay!' });
  }
});

// Lấy chi tiết chuyến bay
router.get('/flights/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        f.id, f.flight_code, f.departure_time, f.arrival_time, f.price, f.total_seats,
        f.airline_id, f.origin_airport, f.destination_airport
      FROM flights f
      WHERE f.id = ? AND f.is_active = TRUE
    `, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến bay!' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn chuyến bay!' });
  }
});

// Thêm chuyến bay
router.post('/flights', async (req, res) => {
  const { flight_code, airline_id, origin_airport, destination_airport, departure_time, arrival_time, total_seats, price } = req.body;
  if (!flight_code || !airline_id || !origin_airport || !destination_airport || !departure_time || !arrival_time || !total_seats || !price) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
  }
  try {
    await db.query(`
      INSERT INTO flights (flight_code, airline_id, origin_airport, destination_airport, departure_time, arrival_time, total_seats, price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [flight_code, airline_id, origin_airport, destination_airport, departure_time, arrival_time, total_seats, price]);
    res.json({ message: 'Thêm chuyến bay thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi thêm chuyến bay!' });
  }
});

// Sửa chuyến bay
router.put('/flights/:id', async (req, res) => {
  const { id } = req.params;
  const { flight_code, airline_id, origin_airport, destination_airport, departure_time, arrival_time, total_seats, price } = req.body;
  if (!flight_code || !airline_id || !origin_airport || !destination_airport || !departure_time || !arrival_time || !total_seats || !price) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
  }
  try {
    await db.query(`
      UPDATE flights
      SET flight_code = ?, airline_id = ?, origin_airport = ?, destination_airport = ?, 
          departure_time = ?, arrival_time = ?, total_seats = ?, price = ?
      WHERE id = ?
    `, [flight_code, airline_id, origin_airport, destination_airport, departure_time, arrival_time, total_seats, price, id]);
    res.json({ message: 'Cập nhật chuyến bay thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi cập nhật chuyến bay!' });
  }
});

// Xóa chuyến bay
router.delete('/flights/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE flights SET is_active = FALSE WHERE id = ?', [id]);
    res.json({ message: 'Xóa chuyến bay thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi xóa chuyến bay!' });
  }
});

// --- Quản lý đơn hàng ---

// Lấy danh sách đơn hàng
router.get('/bookings', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, origin_city, destination_city, total_tickets, total_amount, status
      FROM bookings
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn đơn hàng!' });
  }
});

// Cập nhật trạng thái đơn hàng
router.put('/bookings/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ!' });
  }
  try {
    await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Cập nhật trạng thái thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái!' });
  }
});

// Xóa đơn hàng
router.delete('/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM bookings WHERE id = ?', [id]);
    res.json({ message: 'Xóa đơn hàng thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi xóa đơn hàng!' });
  }
});

// --- Quản lý người dùng ---

// Lấy danh sách người dùng
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, full_name, email, phone, role FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn người dùng!' });
  }
});

// Lấy chi tiết người dùng
router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id, username, full_name, email, phone, role FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng!' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn người dùng!' });
  }
});

// Thêm người dùng
router.post('/users', async (req, res) => {
  const { username, password, full_name, email, phone, role } = req.body;
  if (!username || !password || !full_name || !email || !phone || !role) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
  }
  try {
    await db.query(`
      INSERT INTO users (username, password, full_name, email, phone, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [username, password, full_name, email, phone, role]);
    res.json({ message: 'Thêm người dùng thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi thêm người dùng!' });
  }
});

// Sửa người dùng
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, full_name, email, phone, role } = req.body;
  if (!username || !full_name || !email || !phone || !role) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
  }
  try {
    const query = password
      ? 'UPDATE users SET username = ?, password = ?, full_name = ?, email = ?, phone = ?, role = ? WHERE id = ?'
      : 'UPDATE users SET username = ?, full_name = ?, email = ?, phone = ?, role = ? WHERE id = ?';
    const params = password
      ? [username, password, full_name, email, phone, role, id]
      : [username, full_name, email, phone, role, id];
    await db.query(query, params);
    res.json({ message: 'Cập nhật người dùng thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi cập nhật người dùng!' });
  }
});

// Xóa người dùng
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Xóa người dùng thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi xóa người dùng!' });
  }
});

// --- Thống kê ---

// Doanh thu theo tháng
router.get('/statistics/revenue', async (req, res) => {
  const { year } = req.query;
  if (!year || isNaN(year)) {
    return res.status(400).json({ error: 'Năm không hợp lệ!' });
  }
  try {
    const [rows] = await db.query(`
      SELECT MONTH(booking_time) AS month, SUM(total_amount) AS total
      FROM bookings
      WHERE YEAR(booking_time) = ? AND status = 'confirmed'
      GROUP BY MONTH(booking_time)
      ORDER BY MONTH(booking_time)
    `, [year]);
    // Fill in missing months with 0
    const data = Array(12).fill(0).map((_, i) => {
      const monthData = rows.find(row => row.month === i + 1);
      return { month: i + 1, total: monthData ? Number(monthData.total) : 0 };
    });
    res.json({ data });
  } catch (err) {
    console.error('Lỗi truy vấn doanh thu:', err.message, err.stack);
    res.status(500).json({ error: `Lỗi khi truy vấn doanh thu: ${err.message}` });
  }
});

// Số vé bán được theo tháng
router.get('/statistics/tickets', async (req, res) => {
  const { year } = req.query;
  if (!year || isNaN(year)) {
    return res.status(400).json({ error: 'Năm không hợp lệ!' });
  }
  try {
    const [rows] = await db.query(`
      SELECT MONTH(booking_time) AS month, SUM(total_tickets) AS tickets
      FROM bookings
      WHERE YEAR(booking_time) = ? AND status = 'confirmed'
      GROUP BY MONTH(booking_time)
      ORDER BY MONTH(booking_time)
    `, [year]);
    // Fill in missing months with 0
    const data = Array(12).fill(0).map((_, i) => {
      const monthData = rows.find(row => row.month === i + 1);
      return { month: i + 1, tickets: monthData ? Number(monthData.tickets) : 0 };
    });
    res.json({ data });
  } catch (err) {
    console.error('Lỗi truy vấn số vé:', err.message, err.stack);
    res.status(500).json({ error: `Lỗi khi truy vấn số vé: ${err.message}` });
  }
});

// Điểm đến phổ biến
router.get('/statistics/destinations', async (req, res) => {
  const { year } = req.query;
  if (!year || isNaN(year)) {
    return res.status(400).json({ error: 'Năm không hợp lệ!' });
  }
  try {
    const [rows] = await db.query(`
      SELECT c.city_name, COUNT(b.id) AS bookings
      FROM bookings b
      JOIN flights f ON b.flight_id = f.id
      JOIN airports a ON f.destination_airport = a.id
      JOIN cities c ON a.city_id = c.id
      WHERE YEAR(b.booking_time) = ? AND b.status = 'confirmed'
      GROUP BY c.id, c.city_name
      ORDER BY bookings DESC
      LIMIT 5
    `, [year]);
    res.json({ data: rows });
  } catch (err) {
    console.error('Lỗi truy vấn điểm đến:', err.message, err.stack);
    res.status(500).json({ error: `Lỗi khi truy vấn điểm đến: ${err.message}` });
  }
});


// --- Chuyến bay đề xuất ---

router.get('/suggestions', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ticket_suggestions ORDER BY display_order');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn chuyến bay đề xuất!' });
  }
});

router.get('/suggestions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM ticket_suggestions WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến bay đề xuất!' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn chuyến bay đề xuất!' });
  }
});

router.post('/suggestions', async (req, res) => {
  const { origin_city_name, destination_city_name, image_url, price, display_order } = req.body;
  if (!origin_city_name || !destination_city_name || !price || !display_order) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
  }
  try {
    await db.query(
      'INSERT INTO ticket_suggestions (origin_city_name, destination_city_name, image_url, price, display_order) VALUES (?, ?, ?, ?, ?)',
      [origin_city_name, destination_city_name, image_url, price, display_order]
    );
    res.json({ message: 'Thêm chuyến bay đề xuất thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi thêm chuyến bay đề xuất!' });
  }
});

router.put('/suggestions/:id', async (req, res) => {
  const { id } = req.params;
  const { origin_city_name, destination_city_name, image_url, price, display_order } = req.body;
  if (!origin_city_name || !destination_city_name || !price || !display_order) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
  }
  try {
    await db.query(
      'UPDATE ticket_suggestions SET origin_city_name = ?, destination_city_name = ?, image_url = ?, price = ?, display_order = ? WHERE id = ?',
      [origin_city_name, destination_city_name, image_url, price, display_order, id]
    );
    res.json({ message: 'Cập nhật chuyến bay đề xuất thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi cập nhật chuyến bay đề xuất!' });
  }
});

router.delete('/suggestions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM ticket_suggestions WHERE id = ?', [id]);
    res.json({ message: 'Xóa chuyến bay đề xuất thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi xóa chuyến bay đề xuất!' });
  }
});


// --- Quản lý báo cáo ---

// Lấy danh sách báo cáo
router.get('/reports', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT r.id, r.title, r.created_at, u.full_name AS created_by_name
      FROM reports r
      JOIN users u ON r.created_by = u.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn báo cáo!' });
  }
});

// Lấy chi tiết báo cáo
router.get('/reports/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id, title, content FROM reports WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy báo cáo!' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn báo cáo!' });
  }
});

// Thêm báo cáo
router.post('/reports', async (req, res) => {
  const { title, content } = req.body;
  const created_by = req.user.id; // Giả định lấy từ middleware xác thực
  if (!title || !content) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
  }
  try {
    await db.query('INSERT INTO reports (title, content, created_by) VALUES (?, ?, ?)', [title, content, created_by]);
    res.json({ message: 'Thêm báo cáo thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi thêm báo cáo!' });
  }
});

// Sửa báo cáo
router.put('/reports/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
  }
  try {
    await db.query('UPDATE reports SET title = ?, content = ? WHERE id = ?', [title, content, id]);
    res.json({ message: 'Cập nhật báo cáo thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi cập nhật báo cáo!' });
  }
});

// Xóa báo cáo
router.delete('/reports/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM reports WHERE id = ?', [id]);
    res.json({ message: 'Xóa báo cáo thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi xóa báo cáo!' });
  }
});

module.exports = router;