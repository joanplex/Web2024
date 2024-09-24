CREATE DATABASE IF NOT EXISTS disaster_relief CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE disaster_relief;

-- Set the default character set and collation for the connection
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(100) ,
    lastName VARCHAR(100) ,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(100) ,
    phone VARCHAR(100) ,
    role ENUM('admin', 'rescuer', 'citizen') NOT NULL DEFAULT 'admin',
    latitude FLOAT ,
    longitude FLOAT 
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,  
    name VARCHAR(255) UNIQUE
);

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(255),
    category_id INT,
    quantity INT,
    description TEXT,  
    vqitem INT, 
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    item_id INT,
    quantity INT,
    status ENUM('pending', 'accepted', 'completed', 'cancelled') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    item_id INT,
    quantity INT,
    status ENUM('pending', 'accepted', 'completed', 'cancelled') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS vehicles (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    location_lat FLOAT,
    location_lng FLOAT,
    status ENUM('active', 'inactive') DEFAULT 'inactive',
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicle_load (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT,
    item_id INT,
    quantity INT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Collate fixes greek
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT,
    request_id INT,
    offer_id INT,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (request_id) REFERENCES requests(id),
    FOREIGN KEY (offer_id) REFERENCES offers(id)
);

-- ADMINS (password: admin)
INSERT INTO users (firstName, lastName, username, password, role)
VALUES ('John', 'Doe', 'admin@vu.gr', '$2a$10$271tiZlVI0u02gxBLiCZwe75DD/hSB5zztxUglMrsopkMqoY14Dsi', 'admin')
ON DUPLICATE KEY UPDATE
    firstName = VALUES(firstName),
    lastName = VALUES(lastName),
    password = VALUES(password),
    role = VALUES(role);

-- Insert or update second admin user
INSERT INTO users (firstName, lastName, username, password, role)
VALUES ('Jane', 'Doe', 'admin2@vu.gr', '$2a$10$271tiZlVI0u02gxBLiCZwe75DD/hSB5zztxUglMrsopkMqoY14Dsi', 'admin')
ON DUPLICATE KEY UPDATE
    firstName = VALUES(firstName),
    lastName = VALUES(lastName),
    password = VALUES(password),
    role = VALUES(role);

INSERT INTO users (firstName, lastName, username, password, role)
VALUES ('Rescuer', 'Doe', 'rescuer@vu.gr', '$2a$10$271tiZlVI0u02gxBLiCZwe75DD/hSB5zztxUglMrsopkMqoY14Dsi', 'rescuer')
ON DUPLICATE KEY UPDATE
    firstName = VALUES(firstName),
    lastName = VALUES(lastName),
    password = VALUES(password),
    role = VALUES(role);

-- Προϊόντα
INSERT INTO categories (name) VALUES ('Food') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO categories (name) VALUES ('Other') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO categories (name) VALUES ('Medical Supplies') ON DUPLICATE KEY UPDATE name=name;
INSERT INTO categories (name) VALUES ('Tools') ON DUPLICATE KEY UPDATE name=name;

INSERT INTO items (name, category_id, quantity) 
VALUES ('Bread', (SELECT id FROM categories WHERE name = 'Food'), 100) 
ON DUPLICATE KEY UPDATE name=name, category_id=category_id, quantity=quantity;

INSERT INTO items (name, category_id, quantity) 
VALUES ('Rice', (SELECT id FROM categories WHERE name = 'Food'), 150) 
ON DUPLICATE KEY UPDATE name=name, category_id=category_id, quantity=quantity;

INSERT INTO items (name, category_id, quantity) 
VALUES ('Canned Beans', (SELECT id FROM categories WHERE name = 'Food'), 200) 
ON DUPLICATE KEY UPDATE name=name, category_id=category_id, quantity=quantity;

INSERT INTO items (name, category_id, quantity) 
VALUES ('Water Bottle', (SELECT id FROM categories WHERE name = 'Other'), 300) 
ON DUPLICATE KEY UPDATE name=name, category_id=category_id, quantity=quantity;

INSERT INTO items (name, category_id, quantity) 
VALUES ('Juice', (SELECT id FROM categories WHERE name = 'Other'), 250) 
ON DUPLICATE KEY UPDATE name=name, category_id=category_id, quantity=quantity;

INSERT INTO items (name, category_id, quantity) 
VALUES ('Painkillers', (SELECT id FROM categories WHERE name = 'Medical Supplies'), 50) 
ON DUPLICATE KEY UPDATE name=name, category_id=category_id, quantity=quantity;

INSERT INTO items (name, category_id, quantity) 
VALUES ('Antibiotics', (SELECT id FROM categories WHERE name = 'Medical Supplies'), 30) 
ON DUPLICATE KEY UPDATE name=name, category_id=category_id, quantity=quantity;

INSERT INTO items (name, category_id, quantity) 
VALUES ('Bandages', (SELECT id FROM categories WHERE name = 'Medical Supplies'), 100) 
ON DUPLICATE KEY UPDATE name=name, category_id=category_id, quantity=quantity;

INSERT INTO items (name, category_id, quantity) 
VALUES ('Gloves', (SELECT id FROM categories WHERE name = 'Medical Supplies'), 200) 
ON DUPLICATE KEY UPDATE name=name, category_id=category_id, quantity=quantity;

INSERT INTO items (name, category_id, quantity) 
VALUES ('Masks', (SELECT id FROM categories WHERE name = 'Medical Supplies'), 150) 
ON DUPLICATE KEY UPDATE name=name, category_id=category_id, quantity=quantity;

INSERT INTO vehicles (id, location_lat, location_lng, status, last_update) 
VALUES 
(1, 38.2465, 21.7346, 'active', '2024-09-16 14:12:28'),
(2, NULL, NULL, 'inactive', '2024-09-15 22:19:56'),
(3, NULL, NULL, 'active', '2024-09-15 22:19:56')
ON DUPLICATE KEY UPDATE
    location_lat = VALUES(location_lat),
    location_lng = VALUES(location_lng),
    status = VALUES(status),
    last_update = VALUES(last_update);

INSERT INTO items (id, name, category_id, quantity) VALUES
(20, 'Unknown Item 20', (SELECT id FROM categories WHERE name = 'Other'), 0),
(21, 'Unknown Item 21', (SELECT id FROM categories WHERE name = 'Other'), 0),
(22, 'Unknown Item 22', (SELECT id FROM categories WHERE name = 'Other'), 0),
(25, 'Unknown Item 25', (SELECT id FROM categories WHERE name = 'Other'), 0),
(26, 'Unknown Item 26', (SELECT id FROM categories WHERE name = 'Other'), 0),
(30, 'Unknown Item 30', (SELECT id FROM categories WHERE name = 'Other'), 0)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    category_id = VALUES(category_id),
    quantity = VALUES(quantity);

INSERT INTO vehicle_load (id, vehicle_id, item_id, quantity)
VALUES
(6, 1, 20, 1),
(8, 1, 25, 1),
(9, 1, 26, 1),
(10, 1, 21, 1),
(12, 1, 25, 1),
(13, 1, 30, 1),
(14, 1, 22, 1),
(15, 1, 25, 1)
ON DUPLICATE KEY UPDATE
    vehicle_id = VALUES(vehicle_id),
    item_id = VALUES(item_id),
    quantity = VALUES(quantity);

-- Εισαγωγή 1ης ανακοίνωσης
INSERT INTO announcements (title, description, created_at)
VALUES ('Νέα Παράδοση Προϊόντων', 'Παραλάβαμε νέα προϊόντα στην αποθήκη μας.', NOW());

-- Εισαγωγή 2ης ανακοίνωσης
INSERT INTO announcements (title, description, created_at)
VALUES ('Επείγουσα Ανάγκη για Προμήθειες', 'Χρειαζόμαστε άμεσα προμήθειες φαρμάκων.', NOW());

-- Εισαγωγή 3ης ανακοίνωσης
INSERT INTO announcements (title, description, created_at)
VALUES ('Εκδήλωση Εθελοντισμού', 'Οργανώνουμε νέα εκδήλωση για να μαζέψουμε περισσότερους εθελοντές.', NOW());

-- Εισαγωγή 4ης ανακοίνωσης
INSERT INTO announcements (title, description, created_at)
VALUES ('Συγκέντρωση Τροφίμων', 'Ξεκινάμε νέα καμπάνια για συγκέντρωση τροφίμων.', NOW());

-- Εισαγωγή 5ης ανακοίνωσης
INSERT INTO announcements (title, description, created_at)
VALUES ('Αναβάθμιση της Αποθήκης', 'Ενημερώνουμε ότι γίνονται εργασίες για την αναβάθμιση της αποθήκης.', NOW());