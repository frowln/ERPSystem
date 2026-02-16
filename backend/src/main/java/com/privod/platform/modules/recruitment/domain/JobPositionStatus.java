package com.privod.platform.modules.recruitment.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum JobPositionStatus {

    OPEN("Открыта"),
    RECRUITMENT_IN_PROGRESS("Набор в процессе"),
    CLOSED("Закрыта");

    private final String displayName;
}
