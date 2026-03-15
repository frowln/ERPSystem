package com.privod.platform.modules.accounting.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReclamationStatus {

    DRAFT("Черновик"),
    SENT("Отправлена"),
    ACCEPTED("Принята"),
    REJECTED("Отклонена"),
    RESOLVED("Урегулирована"),
    COURT("Суд");

    private final String displayName;
}
