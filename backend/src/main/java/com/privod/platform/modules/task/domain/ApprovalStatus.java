package com.privod.platform.modules.task.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ApprovalStatus {

    PENDING("Ожидает"),
    APPROVED("Утверждён"),
    REJECTED("Отклонён"),
    DELEGATED("Делегирован");

    private final String displayName;
}
