package com.privod.platform.modules.messaging.web.dto;

import java.util.UUID;

public record OrgUserResponse(
    UUID id,
    String fullName,
    String email,
    String avatarUrl,
    boolean isOnline
) {}
