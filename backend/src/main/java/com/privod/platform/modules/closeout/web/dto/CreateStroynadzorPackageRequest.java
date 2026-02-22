package com.privod.platform.modules.closeout.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateStroynadzorPackageRequest(
        @NotNull UUID projectId,
        UUID wbsNodeId,
        @NotBlank String name,
        String notes
) {
}
