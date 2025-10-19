-- Insert Default Subscription Plans
-- Run this after creating the schema

-- ============================================
-- INSERT DEFAULT PLANS
-- ============================================

INSERT INTO plans (name, slug, description, price, currency, billing_cycle, credits_per_month, features, max_projects, max_storage_gb, max_team_members, is_active, is_popular, display_order)
VALUES 
-- Free Plan
(
    'Free',
    'free',
    'Perfect for getting started with basic legal research',
    0.00,
    'USD',
    'monthly',
    50,
    '{"features": ["50 AI queries per month", "Basic legal research", "Document templates", "Email support", "Search case laws"]}',
    3,
    1,
    1,
    TRUE,
    FALSE,
    1
),

-- Basic Plan
(
    'Basic',
    'basic',
    'For students and professionals who need more power',
    29.99,
    'USD',
    'monthly',
    500,
    '{"features": ["500 AI queries per month", "Advanced legal research", "Unlimited document templates", "Priority email support", "Case law search", "Document generation", "Citation manager", "Export to PDF/Word"]}',
    10,
    10,
    3,
    TRUE,
    FALSE,
    2
),

-- Pro Plan
(
    'Pro',
    'pro',
    'Best for law firms and working professionals',
    99.99,
    'USD',
    'monthly',
    2000,
    '{"features": ["2000 AI queries per month", "Advanced AI-powered research", "Unlimited projects", "Priority support (24/7)", "Case law & statute search", "Advanced document generation", "Team collaboration", "Custom templates", "API access", "Analytics dashboard", "Bulk operations"]}',
    NULL,
    50,
    10,
    TRUE,
    TRUE,
    3
),

-- Enterprise Plan
(
    'Enterprise',
    'enterprise',
    'Custom solution for large law firms and organizations',
    299.99,
    'USD',
    'monthly',
    10000,
    '{"features": ["10000+ AI queries per month", "Dedicated AI models", "Unlimited everything", "Dedicated account manager", "24/7 phone support", "Custom integrations", "Advanced security", "SSO/SAML", "Custom training", "SLA guarantee", "White-label option", "Advanced analytics"]}',
    NULL,
    NULL,
    NULL,
    TRUE,
    FALSE,
    4
),

-- Yearly Basic Plan (20% discount)
(
    'Basic (Yearly)',
    'basic-yearly',
    'Save 20% with annual billing',
    287.90,
    'USD',
    'yearly',
    500,
    '{"features": ["500 AI queries per month", "Advanced legal research", "Unlimited document templates", "Priority email support", "Case law search", "Document generation", "Citation manager", "Export to PDF/Word", "20% savings"]}',
    10,
    10,
    3,
    TRUE,
    FALSE,
    5
),

-- Yearly Pro Plan (20% discount)
(
    'Pro (Yearly)',
    'pro-yearly',
    'Save 20% with annual billing - Best value',
    959.90,
    'USD',
    'yearly',
    2000,
    '{"features": ["2000 AI queries per month", "Advanced AI-powered research", "Unlimited projects", "Priority support (24/7)", "Case law & statute search", "Advanced document generation", "Team collaboration", "Custom templates", "API access", "Analytics dashboard", "Bulk operations", "20% savings"]}',
    NULL,
    50,
    10,
    TRUE,
    TRUE,
    6
);

-- ============================================
-- VERIFY INSERTION
-- ============================================

SELECT 
    name,
    slug,
    price,
    billing_cycle,
    credits_per_month,
    is_active,
    is_popular
FROM plans
ORDER BY display_order;
