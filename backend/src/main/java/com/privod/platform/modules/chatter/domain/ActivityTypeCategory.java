package com.privod.platform.modules.chatter.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ActivityTypeCategory {

    DEFAULT("По умолчанию"),
    UPLOAD_FILE("Загрузка файла"),
    PHONECALL("Телефонный звонок"),
    MEETING("Встреча"),
    REQUEST_SIGN("Запрос подписи");

    private final String displayName;
}
