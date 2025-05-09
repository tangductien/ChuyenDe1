// routes/get_cities_routes.js
const express = require('express');
const db = require('../config/db');
const router = express.Router();

// Route GET /api/cities
router.get('/cities', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.city_name, c.country, a.airport_code
      FROM cities c
      LEFT JOIN airports a ON c.id = a.city_id
      WHERE a.airport_code IS NOT NULL
      ORDER BY c.city_name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi truy vấn database!' });
  }
});

module.exports = router;