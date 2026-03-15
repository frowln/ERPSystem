package com.privod.platform.modules.buildingModel.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateBuildingSectionRequest(
        @NotBlank String name,
        String code,
        Integer sectionOrder,
        Integer floorCount,
        String description
) {
}
