package com.privod.platform.modules.bim.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public record ElementMetadataRequest(
        @NotBlank(message = "GUID элемента обязателен")
        String elementGuid,

        String elementName,
        String ifcType,
        String floorName,
        String systemName,
        Map<String, Object> propertiesJson
) {
}
