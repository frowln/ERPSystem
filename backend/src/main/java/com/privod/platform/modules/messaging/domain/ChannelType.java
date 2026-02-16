package com.privod.platform.modules.messaging.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChannelType {

    PUBLIC("Публичный"),
    PRIVATE("Приватный"),
    DIRECT("Личные сообщения");

    private final String displayName;
}
