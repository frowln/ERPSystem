package com.privod.platform.modules.closing.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OneCPostingStatus {

    NOT_SENT("Не отправлен"),
    SENT("Отправлен в 1С"),
    POSTED("Проведён в 1С"),
    ERROR("Ошибка отправки");

    private final String displayName;
}
