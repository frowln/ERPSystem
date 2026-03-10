package com.privod.platform.modules.bidManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BidInvitationStatus {

    INVITED("Приглашён"),
    VIEWED("Просмотрено"),
    SUBMITTED("Подана"),
    DECLINED("Отклонена"),
    DISQUALIFIED("Дисквалифицирован");

    private final String displayName;
}
