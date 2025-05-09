const express = require('express');
const db = require('../config/db');
const router = express.Router();

// API tìm kiếm vé
router.post('/tickets/search', async (req, res) => {
  const { from, to, departDate, returnDate, tripType, adult, child, infant, seatClass } = req.body;

  // Kiểm tra dữ liệu
  if (!from || !to || !departDate) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc!' });
  }

  try {
    // Truy vấn database để lấy các chuyến bay phù hợp
    let [rows] = await db.query(`
      SELECT 
        f.id,
        f.flight_code,
        f.departure_time,
        f.arrival_time,
        f.price,
        al.airline_name AS airline,
        origin_city.city_name AS origin,
        dest_city.city_name AS destination
      FROM flights f
      JOIN airports origin_airport ON f.origin_airport = origin_airport.id
      JOIN airports dest_airport ON f.destination_airport = dest_airport.id
      JOIN cities origin_city ON origin_airport.city_id = origin_city.id
      JOIN cities dest_city ON dest_airport.city_id = dest_city.id
      JOIN airlines al ON f.airline_id = al.id
      WHERE origin_city.city_name = ?
        AND dest_city.city_name = ?
        AND DATE(f.departure_time) = ?
        AND f.is_active = TRUE
      ORDER BY f.departure_time ASC
    `, [from, to, departDate]);

    // Nếu không tìm thấy chuyến bay, tạo dữ liệu mới
    if (rows.length === 0) {
      const totalPassengers = parseInt(adult) + parseInt(child) + parseInt(infant);
      const airlines = ['Vietnam Airlines', 'Vietjet Air', 'Bamboo Airways', 'Pacific Airlines'];
      const numFlights = Math.floor(Math.random() * 3) + 3; // Tạo ngẫu nhiên 3-5 chuyến bay

      for (let i = 0; i < numFlights; i++) {
        // Tạo giờ khởi hành ngẫu nhiên trong ngày
        const hour = Math.floor(Math.random() * 15) + 6; // Từ 6h sáng đến 21h tối
        const minute = Math.floor(Math.random() * 60);
        const departureTime = `${departDate} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

        // Tạo thời gian bay ngẫu nhiên (2h đến 2h30, step 5 phút, 50% là 2h)
        let flightDurationMinutes;
        if (Math.random() < 0.5) {
          flightDurationMinutes = 120; // 2 giờ
        } else {
          const steps = [0, 5, 10, 15, 20, 25, 30]; // Các bước phút từ 2h
          const randomStep = steps[Math.floor(Math.random() * steps.length)];
          flightDurationMinutes = 120 + randomStep;
        }

        // Tính thời gian đến
        const departureDateTime = new Date(`${departDate}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
        departureDateTime.setMinutes(departureDateTime.getMinutes() + flightDurationMinutes);
        const arrivalHour = departureDateTime.getHours();
        const arrivalMinute = departureDateTime.getMinutes();
        const arrivalDate = departureDateTime.toISOString().split('T')[0]; // Lấy ngày đến
        const arrivalTime = `${arrivalDate} ${arrivalHour.toString().padStart(2, '0')}:${arrivalMinute.toString().padStart(2, '0')}:00`;

        // Tạo giá vé ngẫu nhiên
        const basePrice = Math.floor(Math.random() * 700000) + 800000; // Từ 800,000 đến 1,500,000 VND

        // Lấy airline_id ngẫu nhiên
        const airlineIndex = Math.floor(Math.random() * airlines.length);
        const airlineName = airlines[airlineIndex];
        const [airline] = await db.query(`SELECT id FROM airlines WHERE airline_name = ?`, [airlineName]);
        const airlineId = airline[0].id;

        // Lấy origin_airport và destination_airport
        const [originAirport] = await db.query(`
          SELECT a.id 
          FROM airports a
          JOIN cities c ON a.city_id = c.id
          WHERE c.city_name = ?
        `, [from]);
        const originAirportId = originAirport[0].id;

        const [destAirport] = await db.query(`
          SELECT a.id 
          FROM airports a
          JOIN cities c ON a.city_id = c.id
          WHERE c.city_name = ?
        `, [to]);
        const destAirportId = destAirport[0].id;

        // Tạo mã chuyến bay duy nhất
        let flightCode;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 5;

        while (!isUnique && attempts < maxAttempts) {
          flightCode = `VN${Math.floor(Math.random() * 10000)}`;
          const [existingFlight] = await db.query(`
            SELECT id FROM flights WHERE flight_code = ?
          `, [flightCode]);
          if (existingFlight.length === 0) {
            isUnique = true;
          }
          attempts++;
        }

        if (!isUnique) {
          continue; // Bỏ qua nếu không tạo được flight_code duy nhất
        }

        // Kiểm tra trùng lịch trình
        const [duplicateSchedule] = await db.query(`
          SELECT id 
          FROM flights 
          WHERE origin_airport = ? 
            AND destination_airport = ? 
            AND departure_time = ?
        `, [originAirportId, destAirportId, departureTime]);

        if (duplicateSchedule.length > 0) {
          continue; // Bỏ qua nếu trùng lịch trình
        }

        // Ghi dữ liệu vào bảng flights
        await db.query(`
          INSERT INTO flights (flight_code, airline_id, origin_airport, destination_airport, departure_time, arrival_time, total_seats, price, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [flightCode, airlineId, originAirportId, destAirportId, departureTime, arrivalTime, 180, basePrice, true]);
      }

      // Truy vấn lại để lấy dữ liệu vừa tạo
      [rows] = await db.query(`
        SELECT 
          f.id,
          f.flight_code,
          f.departure_time,
          f.arrival_time,
          f.price,
          al.airline_name AS airline,
          origin_city.city_name AS origin,
          dest_city.city_name AS destination
        FROM flights f
        JOIN airports origin_airport ON f.origin_airport = origin_airport.id
        JOIN airports dest_airport ON f.destination_airport = dest_airport.id
        JOIN cities origin_city ON origin_airport.city_id = origin_city.id
        JOIN cities dest_city ON dest_airport.city_id = dest_city.id
        JOIN airlines al ON f.airline_id = al.id
        WHERE origin_city.city_name = ?
          AND dest_city.city_name = ?
          AND DATE(f.departure_time) = ?
          AND f.is_active = TRUE
        ORDER BY f.departure_time ASC
      `, [from, to, departDate]);
    }

    // Định dạng kết quả
    const tickets = rows.map(row => {
      const departureTime = new Date(row.departure_time);
      const arrivalTime = new Date(row.arrival_time);
      const durationMs = arrivalTime - departureTime;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const duration = `${hours}h ${minutes}p`;

      return {
        id: row.id,
        flightCode: row.flight_code,
        airline: row.airline,
        from: row.origin,
        to: row.destination,
        departureTime: departureTime.toTimeString().slice(0, 5),
        arrivalTime: arrivalTime.toTimeString().slice(0, 5),
        duration: duration,
        stops: "Bay thẳng",
        price: parseInt(row.price),
      };
    });

    // Trả về kết quả
    res.json({ tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi truy vấn hoặc tạo dữ liệu chuyến bay!' });
  }
});

module.exports = router;