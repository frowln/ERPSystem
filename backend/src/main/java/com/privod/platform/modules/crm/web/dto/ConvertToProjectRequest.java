package com.privod.platform.modules.crm.web.dto;

import java.util.UUID;

public record ConvertToProjectRequest(
        String projectName,
        String projectCode,
        UUID projectId
) {
}
