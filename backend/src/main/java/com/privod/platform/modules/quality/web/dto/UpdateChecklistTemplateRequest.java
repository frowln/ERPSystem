package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ChecklistWorkType;

import java.util.List;

public record UpdateChecklistTemplateRequest(
        String name,
        ChecklistWorkType workType,
        List<Object> items
) {
}
