package com.privod.platform.modules.portal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PortalKs2DraftStatus {
    DRAFT("Черновик"),
    SUBMITTED("Отправлен"),
    UNDER_REVIEW("На рассмотрении"),
    APPROVED("Утверждён"),
    REJECTED("Отклонён"),
    CONVERTED("Преобразован");

    private final String displayName;
}
