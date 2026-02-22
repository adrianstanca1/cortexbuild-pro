-- Migration 016: Trial System Integration
-- Adds trial management columns to companies table for SaaS subscription features

-- Add trial and subscription columns to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS trialStartedAt DATETIME;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS trialEndsAt DATETIME;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscriptionStatus VARCHAR(50) DEFAULT 'trial';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscriptionTier VARCHAR(50) DEFAULT 'free';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripeCustomerId VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS stripeSubscriptionId VARCHAR(255);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lastBillingDate DATETIME;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nextBillingDate DATETIME;

-- Create index for trial queries
CREATE INDEX IF NOT EXISTS idx_companies_trial_ends ON companies(trialEndsAt);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON companies(subscriptionStatus);

-- Update existing companies to have trial period (30 days from creation)
UPDATE companies 
SET 
    trialStartedAt = createdAt,
    trialEndsAt = datetime(createdAt, '+30 days'),
    subscriptionStatus = 'trial'
WHERE trialEndsAt IS NULL;
