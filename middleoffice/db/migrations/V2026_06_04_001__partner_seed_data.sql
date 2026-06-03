-- Seed data for partner account (Keycloak preferred_username = 'partner')
-- Run once against the visite database after the backend is up.
-- Assumes categories table already has rows; adjust category_id values to match your DB.

-- Insert sample categories if they don't exist yet (safe: uses INSERT IGNORE)
INSERT IGNORE INTO categories (id, name, icon, description, color, created_at) VALUES
  (1,  'Hôtellerie',        '🏨', 'Hébergements et hôtels',              '#3B82F6', NOW()),
  (2,  'Restauration',      '🍽️', 'Restaurants et gastronomie',           '#F59E0B', NOW()),
  (3,  'Café & Lounge',     '☕', 'Cafés, salons de thé et lounges',      '#8B5CF6', NOW()),
  (4,  'Hébergement',       '🏡', 'Maisons d\'hôtes et riads',            '#10B981', NOW()),
  (5,  'Bien-être & Spa',   '🧖', 'Hammams, spas et centres de bien-être','#EC4899', NOW()),
  (6,  'Espace de travail', '💼', 'Coworkings et salles de réunion',      '#6366F1', NOW());

-- Demandes for the partner user (clientUsername must match Keycloak preferred_username)
INSERT INTO demandes_place (name, description, address, phone, email, category_id, statut, client_username, created_at) VALUES
(
  'Hôtel El Mouradi Sousse',
  'Hôtel 5 étoiles en bord de mer offrant piscines, restaurants et centre de thalassothérapie.',
  'Boulevard du 14 Janvier, Sousse 4000',
  '+216 73 226 000',
  'contact@elmouradi-sousse.tn',
  1,
  'ACCEPTED',
  'partner',
  '2026-05-10 09:15:00'
),
(
  'Restaurant Dar El Jeld',
  'Restaurant de cuisine tunisienne traditionnelle installé dans un palais du XVIIIe siècle en médina.',
  'Rue Dar El Jeld, Médina de Tunis 1008',
  '+216 71 560 916',
  'reservation@dareljeld.tn',
  2,
  'ACCEPTED',
  'partner',
  '2026-05-14 11:30:00'
),
(
  'Café Sidi Chabaane',
  'Café panoramique perché sur la falaise de Sidi Bou Saïd avec vue imprenable sur la mer.',
  'Rue de la Falaise, Sidi Bou Saïd 2026',
  '+216 71 740 091',
  'info@cafesidi.tn',
  3,
  'PENDING',
  'partner',
  '2026-05-22 14:00:00'
),
(
  'Dar Zarrouk Maison d''hôtes',
  'Maison d''hôtes de charme en plein coeur de Sidi Bou Saïd, décoration authentique et vue mer.',
  'Rue de la République, Sidi Bou Saïd 2026',
  '+216 71 740 591',
  'contact@darzarrouk.tn',
  4,
  'PENDING',
  'partner',
  '2026-05-28 10:45:00'
),
(
  'Hammam El Kef Traditionnel',
  'Hammam authentique du XIXe siècle proposant soins traditionnels et massages au savon de Sfax.',
  'Rue de la Kasbah, Le Kef 7100',
  '+216 78 221 034',
  'hammam.elkef@gmail.com',
  5,
  'REFUSED',
  'partner',
  '2026-04-30 08:20:00'
),
(
  'Espace Coworking Lac II',
  'Espace de coworking moderne avec salles de réunion équipées, fibre optique et services premium.',
  'Immeuble Iris, Les Berges du Lac II, Tunis 1053',
  '+216 71 965 200',
  'hello@coworkinglac.tn',
  6,
  'PENDING',
  'partner',
  '2026-06-01 16:00:00'
);
