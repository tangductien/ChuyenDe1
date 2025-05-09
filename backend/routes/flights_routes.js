const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Lấy chi tiết chuyến bay theo ID
router.get('/flights/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        f.id,
        f.flight_code,
        f.departure_time,
        f.arrival_time,
        f.price,
        al.airline_name AS airline,
        origin_city.city_name AS origin,
        dest_city.city_name AS destination,
        origin_airport.airport_code AS origin_code,
        dest_airport.airport_code AS dest_code,
        origin_airport.name AS origin_airport_name,
        dest_airport.name AS dest_airport_name
      FROM flights f
      JOIN airports origin_airport ON f.origin_airport = origin_airport.id
      JOIN airports dest_airport ON f.destination_airport = dest_airport.id
      JOIN cities origin_city ON origin_airport.city_id = origin_city.id
      JOIN cities dest_city ON dest_airport.city_id = dest_city.id
      JOIN airlines al ON f.airline_id = al.id
      WHERE f.id = ? AND f.is_active = TRUE
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy chuyến bay!' });
    }

    const flight = rows[0];
    const departureTime = new Date(flight.departure_time);
    const arrivalTime = new Date(flight.arrival_time);

    // Kiểm tra xem thời gian có hợp lệ không
    if (isNaN(departureTime.getTime()) || isNaN(arrivalTime.getTime())) {
      return res.status(500).json({ error: 'Dữ liệu thời gian chuyến bay không hợp lệ!' });
    }

    const durationMs = arrivalTime - departureTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `${hours} tiếng ${minutes} phút`;

    const response = {
      id: flight.id,
      flightCode: flight.flight_code,
      airline: flight.airline,
      from: flight.origin,
      to: flight.destination,
      originCode: flight.origin_code,
      destCode: flight.dest_code,
      departureTime: departureTime.toISOString(), // Gửi định dạng ISO đầy đủ
      arrivalTime: arrivalTime.toISOString(),   // Gửi định dạng ISO đầy đủ
      duration: duration,
      stops: 'Bay thẳng',
      price: parseInt(flight.price),
      fromAirport: flight.origin_airport_name,
      toAirport: flight.dest_airport_name,
      fromGate: 'Ga 1', // Giả định 
      toGate: 'Ga 1'    // Giả định 
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn dữ liệu chuyến bay!' });
  }
});

module.exports = router;