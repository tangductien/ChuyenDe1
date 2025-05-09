const express = require('express');
const db = require('../config/db');
const router = express.Router();

// API tạo đơn hàng mới
router.post('/bookings', async (req, res) => {
  const { flight_id, total_tickets, total_amount, origin_city, destination_city, departure_time, arrival_time, passengers, contact_email, contact_phone } = req.body;

  try {
    // Kiểm tra dữ liệu đầu vào
    if (!flight_id || !total_tickets || !total_amount || !origin_city || !destination_city || !departure_time || !arrival_time || !passengers || !contact_email || !contact_phone) {
      return res.status(400).json({ error: 'Thiếu thông tin cần thiết!' });
    }

    // Lưu thông tin đơn hàng vào bảng bookings
    const [bookingResult] = await db.query(`
      INSERT INTO bookings (flight_id, origin_city, destination_city, departure_time, arrival_time, total_tickets, total_amount, contact_email, contact_phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `, [flight_id, origin_city, destination_city, departure_time, arrival_time, total_tickets, total_amount, contact_email, contact_phone]);

    const bookingId = bookingResult.insertId;

    // Lưu thông tin hành khách vào bảng passengers
    for (const passenger of passengers) {
      await db.query(`
        INSERT INTO passengers (booking_id, first_name, last_name, gender, date_of_birth, nationality)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [bookingId, passenger.first_name, passenger.last_name, passenger.gender, passenger.date_of_birth, passenger.nationality]);
    }

    res.status(201).json({ message: 'Đặt vé thành công!', booking_id: bookingId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi lưu đơn hàng!' });
  }
});

module.exports = router;