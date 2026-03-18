package com.privod.platform.modules.admin.web.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdateModuleVisibilityRequest(
    @NotNull(message = "disabledModules is required")
    List<String> disabledModules
) {}
