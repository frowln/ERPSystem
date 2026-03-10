package com.privod.platform.modules.messaging.web.dto;

import java.util.List;

public record MessageReactionInfo(
    String emoji,
    int count,
    List<String> userNames,
    boolean includesMe
) {}
