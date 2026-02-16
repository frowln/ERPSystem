package com.privod.platform.modules.messaging.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ActivityCategory {

    DEFAULT("По умолчанию"),
    UPLOAD_FILE("Загрузка файла"),
    PHONECALL("Телефонный звонок"),
    MEETING("Встреча"),
    APPROVAL("Согласование"),
    SIGN("Подпись");

    private final String displayName;
}
