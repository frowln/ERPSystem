-- Expand content_type column to handle long MIME types with parameters
ALTER TABLE email_attachments ALTER COLUMN content_type TYPE VARCHAR(1000);
