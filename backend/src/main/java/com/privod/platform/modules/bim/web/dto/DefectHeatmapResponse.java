package com.privod.platform.modules.bim.web.dto;

import java.util.List;

public record DefectHeatmapResponse(
        long totalDefects,
        List<FloorDefectCount> byFloor,
        List<SystemDefectCount> bySystem,
        List<ElementTypeDefectCount> byElementType
) {
    public record FloorDefectCount(String floorName, long count) {
    }

    public record SystemDefectCount(String systemName, long count) {
    }

    public record ElementTypeDefectCount(String elementType, long count) {
    }
}
