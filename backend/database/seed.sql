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
SELECT id, 'Demo Sello', 'Sello de prueba para recorrer el flujo de metallica.vis.', TRUE
FROM users WHERE email = 'artist@metallica.vis'
AND NOT EXISTS (SELECT 1 FROM artists WHERE name = 'Demo Sello');

INSERT INTO tracks (artist_id, title, description, audio_url, license_type)
SELECT id, 'Ashes on Magnetic Tape', 'Pista de demostración autorizada.', 'https://example.com/audio/ashes-on-magnetic-tape.mp3', 'demo'
FROM artists WHERE name = 'Demo Sello'
AND NOT EXISTS (SELECT 1 FROM tracks WHERE title = 'Ashes on Magnetic Tape');

INSERT INTO pressings (track_id, total_copies, available_copies, generation_limit, status)
SELECT id, 10, 10, 5, 'active'
FROM tracks WHERE title = 'Ashes on Magnetic Tape'
AND NOT EXISTS (SELECT 1 FROM pressings WHERE track_id = id);

INSERT INTO copies (pressing_id, copy_number)
SELECT p.id, numbers.number
FROM pressings p
JOIN (SELECT 1 number UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
      UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10) numbers
WHERE NOT EXISTS (SELECT 1 FROM copies c WHERE c.pressing_id = p.id);

UPDATE copies c
JOIN users u ON u.email = 'collector@metallica.vis'
SET c.current_owner_id = u.id, c.status = 'owned'
WHERE c.copy_number = 1 AND c.pressing_id = 1 AND c.current_owner_id IS NULL;
