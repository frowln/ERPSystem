package com.privod.platform.modules.permission.web.dto;

import java.util.List;
import java.util.Map;

public record PermissionCheckResponse(
        boolean hasAccess,
        String modelName,
        String operation,
        List<String> applicableGroups,
        Map<String, Object> recordFilter
) {
}
