-- ============================================================
-- HostWatch — Migration 002: Seed Markets
-- Run this AFTER 001_initial_schema.sql
-- Pre-loads 20 popular STR cities into the markets table.
-- You can add more cities later from the Supabase Table Editor.
-- ============================================================

insert into public.markets (city, state, country, gov_urls) values

('Nashville',      'TN', 'US', ARRAY['https://www.nashville.gov/departments/codes/short-term-rentals']),
('Austin',         'TX', 'US', ARRAY['https://www.austintexas.gov/department/short-term-rentals']),
('Denver',         'CO', 'US', ARRAY['https://www.denvergov.org/Government/Agencies-Departments-Offices/Community-Planning-and-Development/Business-Licensing/Short-Term-Rentals']),
('New Orleans',    'LA', 'US', ARRAY['https://nola.gov/safety-and-permits/short-term-rentals/']),
('Scottsdale',     'AZ', 'US', ARRAY['https://www.scottsdaleaz.gov/licenses/short-term-rentals']),
('Miami',          'FL', 'US', ARRAY['https://www.miamigov.com/Government/Departments-Organizations/Planning/Short-Term-Vacation-Rentals']),
('San Diego',      'CA', 'US', ARRAY['https://www.sandiego.gov/treasurer/short-term-vacation-rentals']),
('Savannah',       'GA', 'US', ARRAY['https://www.savannahga.gov/1467/Short-Term-Vacation-Rentals']),
('Palm Springs',   'CA', 'US', ARRAY['https://www.palmspringsca.gov/government/departments/finance/short-term-vacation-rentals']),
('Charleston',     'SC', 'US', ARRAY['https://www.charleston-sc.gov/1413/Short-Term-Rentals']),
('Sedona',         'AZ', 'US', ARRAY['https://www.sedonaaz.gov/city-services/community-development/planning/short-term-rentals']),
('Asheville',      'NC', 'US', ARRAY['https://www.ashevillenc.gov/service/apply-for-a-short-term-rental-permit/']),
('Chicago',        'IL', 'US', ARRAY['https://www.chicago.gov/city/en/depts/bacp/supp_info/chicago_short-termresidentialrentalsmobilizationordinance.html']),
('New York City',  'NY', 'US', ARRAY['https://www.nyc.gov/site/specialenforcement/registration/short-term-rental-registration.page']),
('Los Angeles',    'CA', 'US', ARRAY['https://housing.lacity.gov/residents/home-sharing']),
('Seattle',        'WA', 'US', ARRAY['https://www.seattle.gov/license-and-tax-administration/business-license-tax/short-term-rentals']),
('Portland',       'OR', 'US', ARRAY['https://www.portland.gov/bds/permit-types/short-term-rental']),
('San Francisco',  'CA', 'US', ARRAY['https://www.sf.gov/departments/short-term-rentals']),
('Boston',         'MA', 'US', ARRAY['https://www.boston.gov/departments/inspectional-services/short-term-rental-ordinance']),
('Phoenix',        'AZ', 'US', ARRAY['https://www.phoenix.gov/pdd/short-term-rentals']);
