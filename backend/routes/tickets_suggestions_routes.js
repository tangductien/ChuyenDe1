// routes/ticket_suggestions_routes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const router = express.Router();

// Cấu hình lưu ảnh
const storage = multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({ storage });

// Lấy danh sách vé đề xuất
router.get('/tickets/suggestions', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                ts.origin_city_name AS origin,
                ts.destination_city_name AS destination,
                ts.price,
                ts.image_url AS image
            FROM ticket_suggestions ts
            ORDER BY ts.display_order ASC
        `);

        const formatted = rows.map(ticket => ({
            from: ticket.origin,
            to: ticket.destination,
            price: parseInt(ticket.price),
            image: ticket.image
        }));

        res.json({ tickets: formatted });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy dữ liệu vé đề xuất!' });
    }
});

// Thêm vé đề xuất
// router.post('/suggestions/add', upload.single('image'), async (req, res) => {
//     const { ticket_id, display_order } = req.body;
//     const file = req.file;

//     if (!file || !ticket_id) {
//         return res.status(400).json({ success: false, message: 'Thiếu thông tin!' });
//     }

//     try {
//         const imageUrl = '/uploads/' + file.filename;
//         const [result] = await db.query(`
//             INSERT INTO ticket_suggestions (ticket_id, image_url, display_order)
//             VALUES (?, ?, ?)
//         `, [ticket_id, imageUrl, display_order || 0]);

//         res.json({ success: true, message: 'Đã thêm vé đề xuất mới!', suggestion_id: result.insertId });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, message: 'Lỗi khi thêm dữ liệu!' });
//     }
// });

module.exports = router;
