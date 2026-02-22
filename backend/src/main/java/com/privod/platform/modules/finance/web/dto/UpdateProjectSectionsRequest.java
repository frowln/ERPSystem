package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record UpdateProjectSectionsRequest(
        @NotNull List<SectionToggle> sections
) {
    public record SectionToggle(UUID id, boolean enabled, Integer sequence) {}
}
