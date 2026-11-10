BEGIN;

SELECT id AS dubai_id FROM city WHERE name = 'Dubai' AND country_code = 'AE' \gset

INSERT INTO restaurant (
    id, name, active, cuisine, categories, price_tier, description, opening_hours, tags,
    formatted_address, parking_instructions, city_id, area, latitude, longitude, menus, menu_status
)
SELECT
    md5('runout-demo-restaurant:' || fixture.name)::uuid,
    'Demo · ' || fixture.name,
    TRUE,
    fixture.cuisine,
    fixture.cuisine,
    ceil(fixture.price / 50.0),
    'Fictional restaurant for booking and matching tests.',
    'Daily, 12:00–23:00 (demo)',
    array_to_string(fixture.tags, ','),
    fixture.area || ', Dubai, United Arab Emirates',
    'Sample parking instructions for the demo.',
    :'dubai_id'::uuid,
    fixture.area,
    fixture.latitude,
    fixture.longitude,
    (
        SELECT jsonb_agg(jsonb_build_object(
            'id', guests,
            'partySize', guests,
            'discountPercentage', 20,
            'priceBeforePerPerson', fixture.price * 1.25,
            'priceAfterPerPerson', fixture.price,
            'sections', jsonb_build_object(
                'STARTERS', jsonb_build_array(jsonb_build_object(
                    'name', 'Market vegetable starter', 'description', 'Shared starter for the table')),
                'MAINS', jsonb_build_array(jsonb_build_object(
                    'name', fixture.cuisine || ' chef’s selection', 'description', 'Example set-menu main')),
                'DESSERTS', jsonb_build_array(jsonb_build_object(
                    'name', 'Seasonal fruit', 'description', 'One serving per person')),
                'DRINKS', jsonb_build_array(jsonb_build_object(
                    'name', 'Sparkling citrus water', 'description', 'One glass per person'))
            )
        ) ORDER BY guests)
        FROM generate_series(2, 6) AS sizes(guests)
    ),
    'APPROVED'
FROM jsonb_to_recordset(:'catalogue'::jsonb) AS fixture(
    name text, cuisine text, price integer, tags text[], area text, latitude double precision, longitude double precision
)
ON CONFLICT (id) DO NOTHING;

SELECT count(*) AS demo_restaurants, count(DISTINCT area) AS dubai_areas,
       sum(jsonb_array_length(menus)) AS published_menus
FROM restaurant
WHERE id IN (
    SELECT md5('runout-demo-restaurant:' || (entry->>'name'))::uuid
    FROM jsonb_array_elements(:'catalogue'::jsonb) AS data(entry)
);

COMMIT;
