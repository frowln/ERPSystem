-- V1149: Учёт медицинских осмотров работников (Приказ Минздрава №29н от 28.01.2021).
-- Предварительные (INITIAL), периодические (PERIODIC) и внеплановые (EXTRAORDINARY) осмотры.

CREATE TABLE IF NOT EXISTS medical_exams (
    id              UUID            NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID            NOT NULL,
    employee_id     UUID            NOT NULL,
    exam_date       DATE            NOT NULL,
    next_exam_date  DATE,
    exam_type       VARCHAR(30)     NOT NULL DEFAULT 'PERIODIC'
                        CHECK (exam_type IN ('INITIAL', 'PERIODIC', 'EXTRAORDINARY')),
    result          VARCHAR(30)     NOT NULL DEFAULT 'ADMITTED'
                        CHECK (result IN ('ADMITTED', 'NOT_ADMITTED', 'RESTRICTED')),
    doctor_name     VARCHAR(300),
    clinic_name     VARCHAR(500),
    notes           TEXT,
    -- BaseEntity audit fields
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    updated_by      VARCHAR(255),
    version         BIGINT          NOT NULL DEFAULT 0,
    deleted         BOOLEAN         NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_medical_exam_org      ON medical_exams (organization_id);
CREATE INDEX idx_medical_exam_employee ON medical_exams (employee_id);
CREATE INDEX idx_medical_exam_next_date ON medical_exams (next_exam_date);
CREATE INDEX idx_medical_exam_deleted  ON medical_exams (deleted) WHERE deleted = FALSE;
