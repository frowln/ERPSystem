package com.privod.platform.modules.hr.domain;

/**
 * Заключение медицинского осмотра (Приказ Минздрава №29н от 28.01.2021).
 */
public enum MedicalExamResult {
    /** Допущен к работе без ограничений. */
    ADMITTED,
    /** Не допущен к работе. */
    NOT_ADMITTED,
    /** Допущен с ограничениями (временными или постоянными). */
    RESTRICTED
}
