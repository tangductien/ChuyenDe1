-- Xóa và tạo lại database
DROP DATABASE IF EXISTS air_ticket;
CREATE DATABASE air_ticket CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE air_ticket;

-- Bảng người dùng
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    full_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng thành phố
CREATE TABLE cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    country VARCHAR(100)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng sân bay
CREATE TABLE airports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    airport_code VARCHAR(3) NOT NULL,
    city_id INT,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng hãng hàng không
CREATE TABLE airlines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    airline_name VARCHAR(100) NOT NULL,
    airline_code VARCHAR(3) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng chuyến bay
CREATE TABLE flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_code VARCHAR(20) NOT NULL UNIQUE,
    airline_id INT,
    origin_airport INT,
    destination_airport INT,
    departure_time DATETIME,
    arrival_time DATETIME,
    total_seats INT,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (airline_id) REFERENCES airlines(id),
    FOREIGN KEY (origin_airport) REFERENCES airports(id),
    FOREIGN KEY (destination_airport) REFERENCES airports(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng đơn hàng
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT, -- Giữ lại nhưng không bắt buộc
    flight_id INT,
    origin_city VARCHAR(100),
    destination_city VARCHAR(100),
    departure_time DATETIME,
    arrival_time DATETIME,
    total_tickets INT,
    total_amount DECIMAL(10,2),
    contact_email VARCHAR(100), -- Thêm cột email liên hệ
    contact_phone VARCHAR(20),  -- Thêm cột số điện thoại liên hệ
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES flights(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng hành khách
CREATE TABLE passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    gender ENUM('male', 'female'),
    date_of_birth DATE,
    nationality VARCHAR(50),
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng giỏ hàng
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    flight_id INT,
    seat_number VARCHAR(10),
    added_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (flight_id) REFERENCES flights(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng báo cáo
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bảng Đề xuất Vé máy bay
CREATE TABLE ticket_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    origin_city_name VARCHAR(100) NOT NULL,
    destination_city_name VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    price DECIMAL(10, 2),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Dữ liệu mẫu

-- Người dùng
INSERT INTO users (username, password, role, full_name, email, phone)
VALUES 
('admin1', 'admin1', 'admin', 'Quản Lý A', 'admin@example.com', '0909999999'),
('user1', 'user1', 'user', 'Người Dùng A', 'user1@example.com', '0912345678');

-- Thành phố
INSERT INTO cities (city_name, country) VALUES
('Đà Nẵng', 'Việt Nam'),
('Tp.Hồ Chí Minh', 'Việt Nam'),
('Hà Nội', 'Việt Nam'),
('Phú Quốc', 'Việt Nam'),
('Huế', 'Việt Nam'),
('Nha Trang', 'Việt Nam'),
('Đà Lạt', 'Việt Nam'),
('Cần Thơ', 'Việt Nam'),
('Hải Phòng', 'Việt Nam'),
('Vinh', 'Việt Nam'),
('Buôn Ma Thuột', 'Việt Nam'),
('Pleiku', 'Việt Nam');

-- Sân bay
INSERT INTO airports (name, airport_code, city_id) VALUES
('Sân bay Quốc tế Đà Nẵng', 'DAD', 1),
('Sân bay Quốc tế Tân Sơn Nhất', 'SGN', 2),
('Sân bay Quốc tế Nội Bài', 'HAN', 3),
('Sân bay Quốc tế Phú Quốc', 'PQC', 4),
('Sân bay Quốc tế Phú Bài', 'HUI', 5),
('Sân bay Quốc tế Cam Ranh', 'CXR', 6),
('Sân bay Liên Khương', 'DLI', 7),
('Sân bay Quốc tế Cần Thơ', 'VCA', 8),
('Sân bay Quốc tế Cát Bi', 'HPH', 9),
('Sân bay Quốc tế Vinh', 'VII', 10),
('Sân bay Buôn Ma Thuột', 'BMV', 11),
('Sân bay Pleiku', 'PXU', 12);

-- Hãng hàng không
INSERT INTO airlines (airline_name, airline_code, description, is_active) VALUES
('Vietnam Airlines', 'VNA', 'Hãng hàng không quốc gia Việt Nam', TRUE),
('Vietjet Air', 'VJC', 'Hãng hàng không giá rẻ phổ biến tại Việt Nam', TRUE),
('Bamboo Airways', 'BAV', 'Hãng hàng không tư nhân với dịch vụ chất lượng cao', TRUE),
('Pacific Airlines', 'PIC', 'Hãng hàng không giá rẻ, trước đây là Jetstar Pacific', TRUE);

-- Chuyến bay
INSERT INTO flights (flight_code, airline_id, origin_airport, destination_airport, departure_time, arrival_time, total_seats, price) VALUES
('VN200', 1, 2, 3, '2025-05-01 06:00:00', '2025-05-01 08:00:00', 180, 950000),
('VN202', 2, 3, 6, '2025-05-02 07:00:00', '2025-05-02 08:45:00', 180, 970000),
('VN204', 3, 4, 2, '2025-05-03 10:00:00', '2025-05-03 11:30:00', 180, 810000),
('VN206', 4, 5, 8, '2025-05-04 08:00:00', '2025-05-04 09:30:00', 180, 880000),
('VN100', 1, 1, 2, '2025-05-01 08:00:00', '2025-05-01 09:30:00', 180, 721640);

-- Vé đề xuất
INSERT INTO ticket_suggestions (origin_city_name, destination_city_name, image_url, price, display_order) VALUES
('Tp.Hồ Chí Minh', 'Hà Nội', '/uploads/hanoi.jpg', 950000, 1),
('Tp.Hồ Chí Minh', 'Phú Quốc', '/uploads/phu_quoc.jpg', 890000, 2),
('Hà Nội', 'Nha Trang', '/uploads/nha_trang.jpg', 970000, 3),
('Hà Nội', 'Đà Lạt', '/uploads/da_lat.jpg', 940000, 4),
('Phú Quốc', 'Tp.Hồ Chí Minh', '/uploads/ho_chi_minh_city.jpg', 810000, 5),
('Phú Quốc', 'Huế', '/uploads/hue.jpg', 830000, 6),
('Huế', 'Cần Thơ', '/uploads/can_tho.jpg', 880000, 7),
('Cần Thơ', 'Hà Nội', '/uploads/hanoi_2.jpg', 860000, 8);

-- Báo cáo
INSERT INTO reports (title, content, created_by) VALUES
('Báo cáo doanh thu tháng 4', 'Tổng doanh thu đạt 25,000,000 VND.', 1);