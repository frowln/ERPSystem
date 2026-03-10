package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ComplianceStatus {

    compliant("Соответствует"),
    non_compliant("Не соответствует"),
    partial("Частично соответствует");

    private final String displayName;
}
