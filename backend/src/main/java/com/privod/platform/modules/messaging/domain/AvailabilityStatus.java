package com.privod.platform.modules.messaging.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AvailabilityStatus {

    ONLINE("В сети"),
    AWAY("Отошёл"),
    BUSY("Занят"),
    DO_NOT_DISTURB("Не беспокоить"),
    OFFLINE("Не в сети");

    private final String displayName;
}
