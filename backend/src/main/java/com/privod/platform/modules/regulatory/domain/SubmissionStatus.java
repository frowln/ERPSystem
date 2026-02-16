package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SubmissionStatus {

    SUBMITTED("Отправлено"),
    ACCEPTED("Принято"),
    REJECTED("Отклонено"),
    CORRECTION_NEEDED("Требуется корректировка");

    private final String displayName;
}
