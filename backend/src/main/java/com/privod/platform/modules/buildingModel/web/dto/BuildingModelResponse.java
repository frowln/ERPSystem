package com.privod.platform.modules.buildingModel.web.dto;

import java.util.List;
import java.util.UUID;

public record BuildingModelResponse(
        UUID projectId,
        List<BuildingSectionResponse> sections
) {
}
