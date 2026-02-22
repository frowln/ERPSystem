package com.privod.platform.modules.closeout.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AsBuiltLinkStatus {

    PENDING("Ожидает"),
    SUBMITTED("Представлен"),
    ACCEPTED("Принят"),
    REJECTED("Отклонён");

    private final String displayName;
}
