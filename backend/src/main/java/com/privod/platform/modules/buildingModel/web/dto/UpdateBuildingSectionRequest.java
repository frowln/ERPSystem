package com.privod.platform.modules.buildingModel.web.dto;

public record UpdateBuildingSectionRequest(
        String name,
        String code,
        Integer sectionOrder,
        Integer floorCount,
        String description
) {
}
