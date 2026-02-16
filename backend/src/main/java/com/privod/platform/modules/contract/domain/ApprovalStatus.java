package com.privod.platform.modules.contract.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ApprovalStatus {

    PENDING("Ожидает"),
    APPROVED("Одобрено"),
    REJECTED("Отклонено");

    private final String displayName;
}
