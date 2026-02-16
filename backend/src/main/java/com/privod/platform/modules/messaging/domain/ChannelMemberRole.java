package com.privod.platform.modules.messaging.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChannelMemberRole {

    OWNER("Владелец"),
    ADMIN("Администратор"),
    MEMBER("Участник");

    private final String displayName;
}
