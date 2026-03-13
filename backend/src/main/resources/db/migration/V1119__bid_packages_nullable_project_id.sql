-- Bid packages created from portfolio opportunities may not have a project yet
ALTER TABLE bid_packages ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE bid_packages ALTER COLUMN name SET DEFAULT '';
