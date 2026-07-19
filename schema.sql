CREATE DATABASE IF NOT EXISTS dio_bangunan;
USE dio_bangunan;

CREATE TABLE branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    address TEXT
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100) UNIQUE NULL,
    password VARCHAR(255),
    role ENUM('OWNER', 'MANAGER'),
    branch_id INT NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    default_lead_time INT DEFAULT 3,
    default_safety_stock INT DEFAULT 5
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(255),
    category_id INT,
    unit VARCHAR(50),
    price DECIMAL(10,2),
    ordering_cost DECIMAL(10,2) DEFAULT 0,
    holding_cost DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    branch_id INT,
    stock INT DEFAULT 0,
    lead_time_days INT DEFAULT 3,
    safety_stock INT DEFAULT 5,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    UNIQUE(product_id, branch_id)
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    branch_id INT,
    type ENUM('IN', 'OUT', 'TRANSFER'),
    quantity INT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- Insert Dummy Data for Demo
INSERT INTO branches (name, address) VALUES ('Toko 1 (Pusat)', 'Jl. Merdeka No. 1'), ('Toko 2 (Cabang)', 'Jl. Sudirman No. 2');

INSERT INTO users (username, email, password, role, branch_id) VALUES 
('owner', 'dioorlando@gmail.com', 'password', 'OWNER', NULL),
('manager1', 'manager1@diobangunan.com', 'password', 'MANAGER', 1),
('manager2', 'manager2@diobangunan.com', 'password', 'MANAGER', 2);

INSERT INTO categories (name, default_lead_time, default_safety_stock) VALUES 
('Bahan Bangunan', 3, 20),
('Cat', 2, 10),
('Paku', 1, 15);

INSERT INTO products (sku, name, category_id, unit, price, ordering_cost, holding_cost) VALUES 
('PRD001', 'Semen Portland 50kg', 1, 'Sak', 65000.00, 50000.00, 2000.00),
('PRD002', 'Cat Tembok Putih 5kg', 2, 'Kaleng', 120000.00, 30000.00, 5000.00),
('PRD003', 'Paku Beton 5cm', 3, 'Kg', 25000.00, 10000.00, 1000.00);

INSERT INTO inventory (product_id, branch_id, stock, lead_time_days, safety_stock) VALUES 
(1, 1, 150, 3, 20),
(1, 2, 10, 3, 20),
(2, 1, 30, 2, 10),
(2, 2, 40, 2, 10),
(3, 1, 5, 1, 15),
(3, 2, 100, 1, 15);

INSERT INTO transactions (product_id, branch_id, type, quantity) VALUES 
(1, 1, 'IN', 150),
(1, 2, 'IN', 10),
(2, 1, 'IN', 30),
(2, 2, 'IN', 40),
(3, 1, 'IN', 5),
(3, 2, 'IN', 100);
