package com.privod.platform.modules.compliance.domain;

/**
 * Типы согласий на обработку персональных данных (ст. 9 152-ФЗ).
 */
public enum ConsentType {
    PERSONAL_DATA,
    PRIVACY_POLICY,
    COOKIES,
    SPECIAL_CATEGORY,
    CROSS_BORDER,
    MARKETING,
    BIOMETRIC
}
