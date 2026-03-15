package com.privod.platform.modules.crm.web.dto;

public record BlacklistRequest(
        boolean blacklisted,
        String reason
) {
}
