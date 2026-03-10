-- Task cover color
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS cover_color VARCHAR(20);

-- Task comment reactions (like MessageReaction but for task comments)
CREATE TABLE IF NOT EXISTS task_comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name VARCHAR(255),
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comment_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_task_comment_reactions_comment ON task_comment_reactions(comment_id);
