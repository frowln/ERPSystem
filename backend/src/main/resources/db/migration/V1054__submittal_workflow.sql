-- Enhanced submittal workflow fields
ALTER TABLE submittals ADD COLUMN spec_item_id UUID;
ALTER TABLE submittals ADD COLUMN current_reviewer_id UUID;
ALTER TABLE submittals ADD COLUMN revision_number INTEGER DEFAULT 0;
ALTER TABLE submittals ADD COLUMN days_in_review INTEGER;
