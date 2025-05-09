// server.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors'); // Import cors

const get_cities_routes = require('./routes/get_cities_routes');
const tickets_suggestions_routes = require('./routes/tickets_suggestions_routes');
const tickets_search_routes = require('./routes/tickets_search_routes');
const flights_routes = require('./routes/flights_routes');
const bookings_routes = require('./routes/bookings_routes');
const admin_routes = require('./routes/admin_routes');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());  // Parse JSON body
app.use(cors());  // Sử dụng CORS để xử lý yêu cầu từ các nguồn khác nhau
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Expose thư mục uploads

// Routes
app.use('/api', get_cities_routes);
app.use('/api', tickets_suggestions_routes);
app.use('/api', tickets_search_routes);
app.use('/api', flights_routes);
app.use('/api', bookings_routes);
app.use('/api/admin', admin_routes);

app.get('/health', (req, res) => {
    console.log('Health check passed');
    res.status(200).send('Healthy');
});
  

// Chạy server
app.listen(port, () => {
    console.log(`Server đang chạy tại http://localhost:${port}`);
});
