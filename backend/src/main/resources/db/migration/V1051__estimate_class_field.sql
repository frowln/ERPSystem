-- AACE 18R-97 Estimate Classification
-- Class 1-5 with maturity level description
ALTER TABLE estimates ADD COLUMN estimate_class INTEGER;
ALTER TABLE estimates ADD COLUMN maturity_level VARCHAR(50);
