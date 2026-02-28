-- ============================================================
-- HostWatch — Migration 004: Seed Sources
-- Run this AFTER 003_pivot_schema.sql
--
-- Pre-loads 20 monitored sources:
--   3 e-commerce platforms
--   2 IRS/federal sources
--   15 state sales tax authorities
--
-- scrape_urls will be validated and updated before launch.
-- ============================================================

insert into public.sources (name, source_type, platform_tag, jurisdiction, scrape_urls) values

-- ── E-COMMERCE PLATFORMS ─────────────────────────────────────
(
  'Amazon Seller Central — Seller Policies',
  'platform', 'amazon', 'Platform',
  ARRAY[
    'https://sellercentral.amazon.com/help/hub/reference/G521',
    'https://sellercentral.amazon.com/help/hub/reference/G200285470'
  ]
),
(
  'Shopify — Terms of Service & Acceptable Use',
  'platform', 'shopify', 'Platform',
  ARRAY[
    'https://www.shopify.com/legal/terms',
    'https://www.shopify.com/legal/aup'
  ]
),
(
  'TikTok Shop — US Seller Policies',
  'platform', 'tiktok', 'Platform',
  ARRAY[
    'https://seller-us-stable.tiktok.com/university/policy',
    'https://seller-us-stable.tiktok.com/university/essay?role=1&knowledge_id=10000002'
  ]
),

-- ── IRS / FEDERAL ────────────────────────────────────────────
(
  'IRS — Online Sellers & E-commerce Tax Guidance',
  'federal', 'irs', 'Federal',
  ARRAY[
    'https://www.irs.gov/businesses/small-businesses-self-employed/online-sales',
    'https://www.irs.gov/businesses/small-businesses-self-employed/internet-sales'
  ]
),
(
  'IRS — Filing Deadlines & Tax Calendar',
  'federal', 'irs', 'Federal',
  ARRAY[
    'https://www.irs.gov/businesses/small-businesses-self-employed/online-seller',
    'https://www.irs.gov/filing/individuals/when-to-file'
  ]
),

-- ── STATE SALES TAX AUTHORITIES ──────────────────────────────
(
  'California — CDTFA Sales & Use Tax',
  'state', 'state_tax', 'CA',
  ARRAY['https://www.cdtfa.ca.gov/industry/internet.html']
),
(
  'Texas — Comptroller Internet & E-commerce Sales Tax',
  'state', 'state_tax', 'TX',
  ARRAY['https://comptroller.texas.gov/taxes/sales/online-sellers.php']
),
(
  'New York — Dept. of Taxation & Finance Sales Tax',
  'state', 'state_tax', 'NY',
  ARRAY['https://www.tax.ny.gov/bus/st/stax.htm']
),
(
  'Florida — Dept. of Revenue Sales & Use Tax',
  'state', 'state_tax', 'FL',
  ARRAY['https://floridarevenue.com/taxes/taxesfees/Pages/sales_tax.aspx']
),
(
  'Washington — Dept. of Revenue Retail Sales Tax',
  'state', 'state_tax', 'WA',
  ARRAY['https://dor.wa.gov/taxes-rates/retail-sales-tax']
),
(
  'Illinois — Dept. of Revenue Retailers'' Occupation Tax',
  'state', 'state_tax', 'IL',
  ARRAY['https://tax.illinois.gov/research/taxinformation/sales/rot.html']
),
(
  'Pennsylvania — Dept. of Revenue Sales & Use Tax',
  'state', 'state_tax', 'PA',
  ARRAY['https://www.revenue.pa.gov/TaxTypes/SUT/Pages/default.aspx']
),
(
  'Ohio — Dept. of Taxation Sales & Use Tax',
  'state', 'state_tax', 'OH',
  ARRAY['https://tax.ohio.gov/business/filing-an-ohio-sales-and-use-tax-return']
),
(
  'Georgia — Dept. of Revenue Sales & Use Tax',
  'state', 'state_tax', 'GA',
  ARRAY['https://dor.georgia.gov/taxes/business-taxes/sales-use-tax']
),
(
  'Michigan — Treasury Sales, Use & Withholding Tax',
  'state', 'state_tax', 'MI',
  ARRAY['https://www.michigan.gov/taxes/sales-use-withholding/sales-and-use-tax']
),
(
  'North Carolina — Dept. of Revenue Sales & Use Tax',
  'state', 'state_tax', 'NC',
  ARRAY['https://www.ncdor.gov/taxes-forms/sales-and-use-tax']
),
(
  'Arizona — Dept. of Revenue Transaction Privilege Tax',
  'state', 'state_tax', 'AZ',
  ARRAY['https://azdor.gov/business/transaction-privilege-tax']
),
(
  'Colorado — Dept. of Revenue Sales Tax Guide',
  'state', 'state_tax', 'CO',
  ARRAY['https://tax.colorado.gov/sales-tax-guide']
),
(
  'Nevada — Dept. of Taxation Sales & Use Tax',
  'state', 'state_tax', 'NV',
  ARRAY['https://tax.nv.gov/PageContent/FAQ_Sales_and_Use_Tax.html']
),
(
  'Tennessee — Dept. of Revenue Sales & Use Tax',
  'state', 'state_tax', 'TN',
  ARRAY['https://www.tn.gov/revenue/taxes/sales-and-use-tax.html']
);
