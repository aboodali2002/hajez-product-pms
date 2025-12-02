-- Seed Data for Mahdi App

-- 1. Insert Grand Ballroom Hall
INSERT INTO halls (name, slug, theme_color)
VALUES ('Grand Ballroom', 'grand-ballroom', 'blue')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert a Service into Catalog (if not exists)
INSERT INTO services_catalog (name, is_global)
VALUES ('Standard Wedding Package', true)
ON CONFLICT DO NOTHING; -- Note: name is not unique in schema, but for seed we assume it might be fresh or we just add it. 
-- Actually, schema doesn't have unique constraint on name. Let's just insert it.
-- To avoid duplicates on multiple runs, we might want to check first, but standard SQL script usually assumes clean state or handles conflicts.
-- Let's use a DO block or just insert.
-- For simplicity, let's just insert.

-- 3. Link Service to Hall (need IDs, so we use subqueries)
INSERT INTO hall_services (hall_id, service_id, price)
SELECT h.id, s.id, 5000
FROM halls h, services_catalog s
WHERE h.slug = 'grand-ballroom' AND s.name = 'Standard Wedding Package'
ON CONFLICT (hall_id, service_id) DO NOTHING;

-- 4. Insert Pricing Template for Friday (Day 5)
INSERT INTO pricing_templates (hall_id, day_of_week, price)
SELECT id, 5, 10000
FROM halls
WHERE slug = 'grand-ballroom'
ON CONFLICT (hall_id, day_of_week) DO UPDATE SET price = 10000;

-- 5. Insert Pricing Template for Thursday (Day 4)
INSERT INTO pricing_templates (hall_id, day_of_week, price)
SELECT id, 4, 8000
FROM halls
WHERE slug = 'grand-ballroom'
ON CONFLICT (hall_id, day_of_week) DO UPDATE SET price = 8000;
