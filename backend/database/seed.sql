USE metallica_vis;

-- Contraseña de prueba para los tres usuarios demo: Password123!
INSERT INTO users (username, email, password_hash, display_name)
VALUES
  ('coleccionista_demo', 'collector@metallica.vis', '$2a$12$saBmCpkD2ZTqY0IE47vVqOTb1UZkdUp37k7jpSptK7Y1YjjHnnO9K', 'Coleccionista Demo'),
  ('artista_demo', 'artist@metallica.vis', '$2a$12$saBmCpkD2ZTqY0IE47vVqOTb1UZkdUp37k7jpSptK7Y1YjjHnnO9K', 'Artista Demo'),
  ('admin_demo', 'admin@metallica.vis', '$2a$12$saBmCpkD2ZTqY0IE47vVqOTb1UZkdUp37k7jpSptK7Y1YjjHnnO9K', 'Admin Archivista')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), email = VALUES(email);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r
WHERE u.email = 'collector@metallica.vis' AND r.name = 'collector'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r
WHERE u.email = 'artist@metallica.vis' AND r.name = 'artist'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u CROSS JOIN roles r
WHERE u.email = 'admin@metallica.vis' AND r.name = 'admin'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO artists (owner_user_id, name, biography, verified)
SELECT id, 'Elektra & Megaforce Vaults', 'Archivo histórico oficial de cintas máster y prensajes analógicos originales.', TRUE
FROM users WHERE email = 'artist@metallica.vis'
AND NOT EXISTS (SELECT 1 FROM artists WHERE name = 'Elektra & Megaforce Vaults');

-- Pistas icónicas de Metal con arte de tapa oficial
INSERT INTO tracks (artist_id, title, description, cover_url, audio_url, duration_seconds, is_featured)
SELECT a.id, 'Master of Puppets (Soundboard Master Reel 1986)', 'Toma directa de consola Soundboard 1986. Prensaje máster en cinta Metal Type IV.', 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/b8/5a/82/b85a8259-60d9-bfaa-770a-2baac8380e87/858978005196.png/600x600bb.jpg', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 515, TRUE
FROM artists a WHERE a.owner_user_id = (SELECT id FROM users WHERE email = 'artist@metallica.vis' LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM tracks WHERE title LIKE '%Master of Puppets%');
