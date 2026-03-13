package com.privod.platform.modules.edo.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EdoDocumentStatus {

    DRAFT("Черновик"),
    SENT("Отправлен"),
    DELIVERED("Доставлен"),
    SIGNED_BY_COUNTERPARTY("Подписан контрагентом"),
    REJECTED("Отклонён"),
    ERROR("Ошибка");

    private final String displayName;
}
