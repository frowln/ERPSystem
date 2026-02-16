package com.privod.platform.modules.contractExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClaimStatus {

    FILED("Подана"),
    UNDER_REVIEW("На рассмотрении"),
    ACCEPTED("Принята"),
    REJECTED("Отклонена"),
    RESOLVED("Урегулирована");

    private final String displayName;
}
