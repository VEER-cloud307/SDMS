-- Saptashrungi Disposables Management System (SDMS)
-- Seed Data for MySQL / MariaDB

-- 1. Business Info
INSERT INTO business_info (id, shop_name, owner_name, address, phone, whatsapp_number, email, tagline)
VALUES (
    1,
    'Saptashrungi Disposables',
    'Mr. Chetan Jadav',
    '3/1477, Daxini maholla, Ambawadi, Salabatpura, Reshamwad, Behind Saptashrungi Mandir, Surat - 395002',
    '+91 9082545483',
    '+919082545483',
    'saptashrungidisposables@gmail.com',
    'Premium Eco-Friendly Disposables & Food Packaging Wholesale'
);

-- 2. Users (Admin and Customer)
-- Admin: admin@sdms.com / Admin@123
-- Customer: customer@sdms.com / Customer@123
INSERT INTO users (id, name, email, password, phone, role, address) VALUES
(1, 'Mr. Chetan Jadav (Admin)', 'admin@sdms.com', '$2b$10$Kf8hy395o/TnWeDWRxiHyOVD7YCvG5D1W.wYZYRgSrDH35lpky1bm', '+91 9082545483', 'admin', '3/1477, Daxini maholla, Ambawadi, Salabatpura, Surat'),
(2, 'Rohit Patel', 'customer@sdms.com', '$2b$10$CyZUO6rVCxWRaRdjuOSya.1guPjTtNb.106DJEVyJONrMzuN9bTjG', '+91 9825123456', 'customer', 'B-402, Shanti Heights, Adajan, Surat'),
(3, 'Pooja Shah (Catering)', 'pooja.caterers@gmail.com', '$2b$10$CyZUO6rVCxWRaRdjuOSya.1guPjTtNb.106DJEVyJONrMzuN9bTjG', '+91 9724567890', 'customer', '12, Royal Plaza, Ring Road, Surat');

-- 3. Categories
INSERT INTO categories (id, name, description, icon) VALUES
(1, 'Paper Cups & Glasses', 'Hot & cold paper tea cups, coffee cups, kulhads and ripple glasses', 'coffee'),
(2, 'Plates & Bagasse Bowls', 'Eco-friendly sugarcane bagasse plates, silver foil plates and bowls', 'utensils'),
(3, 'Meal Trays & Containers', 'Hinged takeaway meal boxes, aluminium containers and deli bowls', 'box'),
(4, 'Cutlery & Straws', 'Wooden biodegradable spoons, forks, paper straws and heavy spoons', 'utensil-spoon'),
(5, 'Packaging & Hygiene Essentials', 'Aluminium foil rolls, garbage bags, table napkins and gloves', 'recycle');

-- 4. Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, address, products_supplied) VALUES
(1, 'Gujarat Paper Craft Industries', 'Hareshbhai Mehta', '+91 9825011223', 'sales@gujaratpapercraft.com', 'Plot 45, GIDC Sachin, Surat', 'Paper cups, ripple glasses, paper bowls'),
(2, 'EcoPack Green Solutions', 'Dhaval Sanghavi', '+91 9979033445', 'info@ecopackgreen.in', 'Sarkhej Bavla Road, Ahmedabad', 'Sugarcane bagasse plates, wooden cutlery'),
(3, 'Surat Polythene & Disposables', 'Kantilal Jariwala', '+91 9898055667', 'suratdispo@yahoo.com', 'Udhna Main Road, Surat', 'Garbage bags, deli containers, meal boxes'),
(4, 'Shri Sai Aluminium & Packaging', 'Maheshbhai Rajput', '+91 9427077889', 'shrisaipack@gmail.com', 'Industrial Estate, Vapi', 'Aluminium foil rolls, foil containers');

-- 5. Products (20 Realistic Disposable Products)
INSERT INTO products (id, category_id, supplier_id, name, description, specifications, price, current_stock, minimum_stock, max_order_quantity, online_ordering, image_url) VALUES
(1, 1, 1, '150ml Ripple Paper Cups (Pack of 100)', 'Insulated heat-resistant triple layer ripple cups for hot tea and coffee.', 'Capacity: 150ml | Material: 3-Layer Ripple Paper | Pack: 100 pcs', 85.00, 450, 50, 30, 1, '/images/products/ripple-cups.svg'),
(2, 1, 1, '250ml Hot Coffee / Tea Paper Cups (Pack of 50)', 'Premium heavy GSM leak-proof paper cups with PE coating for cafes and offices.', 'Capacity: 250ml | GSM: 280 GSM | Pack: 50 pcs', 95.00, 120, 30, 20, 1, '/images/products/coffee-cups.svg'),
(3, 1, 1, '65ml Cutting Chai Paper Cups (Pack of 100)', 'Traditional cutting chai size cups ideal for tea stalls, kiosks and functions.', 'Capacity: 65ml | Material: Food-grade Paper | Pack: 100 pcs', 45.00, 800, 100, 50, 1, '/images/products/chai-cups.svg'),
(4, 1, 1, '300ml Cold Drink Printed Paper Glass (Pack of 50)', 'Double poly-coated printed paper glasses ideal for shakes, sodas and juices.', 'Capacity: 300ml | Coating: Double PE | Pack: 50 pcs', 110.00, 18, 25, 15, 1, '/images/products/cold-glasses.svg'),
(5, 2, 2, '10-inch 3-Compartment Bagasse Plates (Pack of 25)', 'Heavy duty compostable sugarcane pulp plates for catering and thali meals.', 'Size: 10 inch | 3 Compartments | 100% Biodegradable | Pack: 25 pcs', 175.00, 300, 40, 25, 1, '/images/products/bagasse-plate.svg'),
(6, 2, 1, '8-inch Heavy Duty Round Paper Plates (Pack of 50)', 'Sturdy round paper plates suitable for snacks, pav bhaji and desserts.', 'Diameter: 8 inches | Laminated | Pack: 50 pcs', 120.00, 550, 50, 30, 1, '/images/products/paper-plate-8.svg'),
(7, 2, 1, '6-inch Silver Foil Snack Plates (Pack of 100)', 'Economic silver coated paper plates for pani puri, chat, and sweets.', 'Size: 6 inches | Silver Foil Coated | Pack: 100 pcs', 80.00, 12, 30, 20, 1, '/images/products/silver-plates.svg'),
(8, 2, 1, '150ml Dosa / Sambar Paper Bowls (Pack of 50)', 'Leak-proof deep disposable bowls suitable for hot liquids and gravies.', 'Capacity: 150ml | Waterproof Inner Lining | Pack: 50 pcs', 65.00, 220, 40, 25, 1, '/images/products/paper-bowls.svg'),
(9, 2, 2, '250ml Heavy Soup Bagasse Bowl (Pack of 25)', 'Microwave-safe eco-friendly sugarcane pulp bowls for hot soups and desserts.', 'Capacity: 250ml | Compostable Bagasse | Pack: 25 pcs', 90.00, 180, 25, 20, 1, '/images/products/soup-bowls.svg'),
(10, 3, 3, '750ml Microwaveable Hinged Container (Pack of 25)', 'Clear lid hinged plastic containers for biryani, noodles and meal takeaways.', 'Capacity: 750ml | Microwave Safe | Airtight Click Lock | Pack: 25 pcs', 210.00, 140, 30, 15, 1, '/images/products/hinged-container.svg'),
(11, 3, 3, '500ml Clear Plastic Deli Container with Lid (Pack of 50)', 'Round clear takeaway deli containers with tight snap-on lids.', 'Capacity: 500ml | BPA Free Virgin Plastic | Pack: 50 pcs', 160.00, 0, 20, 10, 1, '/images/products/deli-container.svg'),
(12, 3, 3, '5-Compartment Meal Box with Separate Lid (Pack of 20)', 'Bento-style 5 compartment box for executive lunches and premium deliveries.', 'Compartments: 5 | Material: Food-Grade PP | Pack: 20 pcs', 260.00, 95, 20, 15, 1, '/images/products/bento-box.svg'),
(13, 3, 4, 'Aluminium Foil Roll (1 Kg Net, 18 Micron)', 'Commercial restaurant grade thick aluminium foil for wrapping rotis and grilling.', 'Weight: 1 Kg Net | Thickness: 18 Microns | Length: ~90m', 340.00, 65, 15, 10, 1, '/images/products/foil-roll.svg'),
(14, 3, 4, 'Aluminium Foil Food Containers 450ml with Lids (Pack of 50)', 'Bakeable and heat-retaining rectangular foil boxes with paper board lids.', 'Capacity: 450ml | Oven & Tandoor Safe | Pack: 50 pcs', 225.00, 80, 20, 15, 1, '/images/products/foil-container.svg'),
(15, 4, 2, 'Birchwood Disposable Wooden Spoons 160mm (Pack of 100)', 'Smooth splinter-free birchwood eco spoons for parties, events and cafes.', 'Length: 160mm | 100% Natural Birch Wood | Pack: 100 pcs', 130.00, 400, 50, 25, 1, '/images/products/wooden-spoon.svg'),
(16, 4, 2, 'Birchwood Disposable Wooden Forks 160mm (Pack of 100)', 'Organic compostable wooden forks for salads, noodles and finger foods.', 'Length: 160mm | Eco-Friendly Chemical Free | Pack: 100 pcs', 130.00, 350, 50, 25, 1, '/images/products/wooden-fork.svg'),
(17, 4, 3, 'Heavy Duty Black Plastic Soup Spoons (Pack of 100)', 'Extra sturdy deep soup spoons for catering and Chinese restaurants.', 'Material: High Grade Polypropylene | Pack: 100 pcs', 75.00, 15, 25, 20, 1, '/images/products/soup-spoon.svg'),
(18, 4, 1, 'Biodegradable Paper Drinking Straws 8mm (Pack of 100)', 'Durable 4-ply paper straws for juices, coconut water and smoothies.', 'Diameter: 8mm | Length: 200mm | Pack: 100 pcs', 60.00, 500, 50, 30, 1, '/images/products/paper-straws.svg'),
(19, 5, 1, '2-Ply Soft White Table Napkins (Pack of 100)', 'High absorption luxury 30x30 cm tissue paper napkins for dining tables.', 'Ply: 2-Ply | Size: 30x30 cm | Pack: 100 pcs', 45.00, 600, 80, 40, 1, '/images/products/table-napkins.svg'),
(20, 5, 3, 'Heavy Duty Black Garbage Bags 30x37 inch (Pack of 30)', 'Tear resistant bio-degradable large dustbin trash bags for hotels and kitchens.', 'Size: 30x37 inch (Large) | Thickness: 35 Microns | Pack: 30 pcs', 140.00, 210, 30, 20, 1, '/images/products/garbage-bags.svg');

-- 6. Incoming Stock
INSERT INTO stock_incoming (id, product_id, supplier_id, quantity, expected_date, status, notes) VALUES
(1, 11, 3, 200, '2026-10-25', 'Expected', 'Restocking 500ml Clear Deli Containers (Currently Out of Stock)'),
(2, 4, 1, 150, '2026-10-26', 'Expected', 'Urgent batch of 300ml cold drink paper glasses'),
(3, 7, 1, 300, '2026-10-28', 'Expected', 'Replenishing 6-inch silver snack plates'),
(4, 1, 1, 500, '2026-10-15', 'Received', 'Routine monthly order of 150ml ripple cups');

-- 7. Sample Orders (10 Orders)
INSERT INTO orders (id, order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, stock_deducted, notes, created_at) VALUES
(1, 'ORD-2026-1001', 2, 'Rohit Patel', 'customer@sdms.com', '+91 9825123456', 'B-402, Shanti Heights, Adajan, Surat', 850.00, 'Delivered', 1, 'Regular delivery for birthday celebration', '2026-10-12 10:30:00'),
(2, 'ORD-2026-1002', 3, 'Pooja Shah', 'pooja.caterers@gmail.com', '+91 9724567890', '12, Royal Plaza, Ring Road, Surat', 1875.00, 'Delivered', 1, 'Weekend corporate lunch catering', '2026-10-13 14:15:00'),
(3, 'ORD-2026-1003', 2, 'Rohit Patel', 'customer@sdms.com', '+91 9825123456', 'B-402, Shanti Heights, Adajan, Surat', 570.00, 'Delivered', 1, 'Foil roll and napkins for home use', '2026-10-14 09:45:00'),
(4, 'ORD-2026-1004', 3, 'Pooja Shah', 'pooja.caterers@gmail.com', '+91 9724567890', '12, Royal Plaza, Ring Road, Surat', 2340.00, 'Delivered', 1, 'Large catering wedding order', '2026-10-15 11:20:00'),
(5, 'ORD-2026-1005', 2, 'Rohit Patel', 'customer@sdms.com', '+91 9825123456', 'B-402, Shanti Heights, Adajan, Surat', 425.00, 'Delivered', 1, 'Ripple cups and wooden spoons', '2026-10-16 16:50:00'),
(6, 'ORD-2026-1006', 3, 'Pooja Shah', 'pooja.caterers@gmail.com', '+91 9724567890', '12, Royal Plaza, Ring Road, Surat', 1420.00, 'Out for Delivery', 1, 'Delivery scheduled for evening dinner', '2026-10-18 11:10:00'),
(7, 'ORD-2026-1007', 2, 'Rohit Patel', 'customer@sdms.com', '+91 9825123456', 'B-402, Shanti Heights, Adajan, Surat', 630.00, 'Preparing', 1, 'Order packed, awaiting dispatch', '2026-10-19 13:40:00'),
(8, 'ORD-2026-1008', 3, 'Pooja Shah', 'pooja.caterers@gmail.com', '+91 9724567890', '12, Royal Plaza, Ring Road, Surat', 1050.00, 'Confirmed', 1, 'Order verified and stock reserved', '2026-10-20 09:15:00'),
(9, 'ORD-2026-1009', 2, 'Rohit Patel', 'customer@sdms.com', '+91 9825123456', 'B-402, Shanti Heights, Adajan, Surat', 360.00, 'Pending', 0, 'New order placed via website', '2026-10-20 14:05:00'),
(10, 'ORD-2026-1010', 2, 'Rohit Patel', 'customer@sdms.com', '+91 9825123456', 'B-402, Shanti Heights, Adajan, Surat', 480.00, 'Cancelled', 0, 'Customer changed event date', '2026-10-17 12:00:00');

-- 8. Order Items
INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity, subtotal) VALUES
-- Order 1: 850
(1, 1, 1, '150ml Ripple Paper Cups (Pack of 100)', 85.00, 10, 850.00),
-- Order 2: 1875
(2, 2, 5, '10-inch 3-Compartment Bagasse Plates (Pack of 25)', 175.00, 5, 875.00),
(3, 2, 10, '750ml Microwaveable Hinged Container (Pack of 25)', 210.00, 3, 630.00),
(4, 2, 18, 'Biodegradable Paper Drinking Straws 8mm (Pack of 100)', 60.00, 4, 240.00),
(5, 2, 15, 'Birchwood Disposable Wooden Spoons 160mm (Pack of 100)', 130.00, 1, 130.00),
-- Order 3: 570
(6, 3, 13, 'Aluminium Foil Roll (1 Kg Net, 18 Micron)', 340.00, 1, 340.00),
(7, 3, 19, '2-Ply Soft White Table Napkins (Pack of 100)', 45.00, 2, 90.00),
(8, 3, 20, 'Heavy Duty Black Garbage Bags 30x37 inch (Pack of 30)', 140.00, 1, 140.00),
-- Order 4: 2340
(9, 4, 12, '5-Compartment Meal Box with Separate Lid (Pack of 20)', 260.00, 6, 1560.00),
(10, 4, 15, 'Birchwood Disposable Wooden Spoons 160mm (Pack of 100)', 130.00, 3, 390.00),
(11, 4, 16, 'Birchwood Disposable Wooden Forks 160mm (Pack of 100)', 130.00, 3, 390.00),
-- Order 5: 425
(12, 5, 1, '150ml Ripple Paper Cups (Pack of 100)', 85.00, 3, 255.00),
(13, 5, 17, 'Heavy Duty Black Plastic Soup Spoons (Pack of 100)', 75.00, 2, 150.00),
(14, 5, 19, '2-Ply Soft White Table Napkins (Pack of 100)', 45.00, 1, 45.00),
-- Order 6: 1420
(15, 6, 14, 'Aluminium Foil Food Containers 450ml with Lids (Pack of 50)', 225.00, 4, 900.00),
(16, 6, 15, 'Birchwood Disposable Wooden Spoons 160mm (Pack of 100)', 130.00, 4, 520.00),
-- Order 7: 630
(17, 7, 10, '750ml Microwaveable Hinged Container (Pack of 25)', 210.00, 3, 630.00),
-- Order 8: 1050
(18, 8, 5, '10-inch 3-Compartment Bagasse Plates (Pack of 25)', 175.00, 6, 1050.00),
-- Order 9: 360
(19, 9, 6, '8-inch Heavy Duty Round Paper Plates (Pack of 50)', 120.00, 3, 360.00),
-- Order 10: 480 (Cancelled)
(20, 10, 6, '8-inch Heavy Duty Round Paper Plates (Pack of 50)', 120.00, 4, 480.00);

-- 9. Sample Bills (5 Bills Generated for Completed Orders)
INSERT INTO bills (id, bill_number, order_id, bill_date, customer_name, customer_phone, customer_address, total_amount, payment_method, payment_status, notes) VALUES
(1, 'BILL-2026-001', 1, '2026-10-12', 'Rohit Patel', '+91 9825123456', 'B-402, Shanti Heights, Adajan, Surat', 850.00, 'UPI / Online', 'Paid', 'Payment received via Google Pay'),
(2, 'BILL-2026-002', 2, '2026-10-13', 'Pooja Shah', '+91 9724567890', '12, Royal Plaza, Ring Road, Surat', 1875.00, 'Bank Transfer / NEFT', 'Paid', 'Catering client advance cleared'),
(3, 'BILL-2026-003', 3, '2026-10-14', 'Rohit Patel', '+91 9825123456', 'B-402, Shanti Heights, Adajan, Surat', 570.00, 'Cash', 'Paid', 'Cash collected on delivery'),
(4, 'BILL-2026-004', 4, '2026-10-15', 'Pooja Shah', '+91 9724567890', '12, Royal Plaza, Ring Road, Surat', 2340.00, 'UPI / Online', 'Paid', 'PhonePe QR payment'),
(5, 'BILL-2026-005', 5, '2026-10-16', 'Rohit Patel', '+91 9825123456', 'B-402, Shanti Heights, Adajan, Surat', 425.00, 'Cash', 'Paid', 'Counter receipt');

-- 10. Sample Customer Enquiries
INSERT INTO enquiries (id, user_id, product_id, name, email, phone, message, status) VALUES
(1, 2, 11, 'Rohit Patel', 'customer@sdms.com', '+91 9825123456', 'When will the 500ml Clear Plastic Deli Containers be back in stock? Need 100 packs next week.', 'Responded'),
(2, 3, 5, 'Pooja Shah', 'pooja.caterers@gmail.com', '+91 9724567890', 'Do you provide customized branding or printing on 3-compartment bagasse plates for bulk orders above 500 packs?', 'In Progress'),
(3, NULL, 13, 'Hitesh Modi', 'hiteshmodi@surathotels.com', '+91 9898112233', 'Need wholesale quotation for 50 rolls of 1kg Aluminium foil delivered to Varachha.', 'New'),
(4, NULL, NULL, 'Sunil Sharma', 'sunil@sharmasweets.in', '+91 9426554433', 'We are opening a new sweet shop in Salabatpura and need continuous supply of disposable boxes and bags.', 'New');
