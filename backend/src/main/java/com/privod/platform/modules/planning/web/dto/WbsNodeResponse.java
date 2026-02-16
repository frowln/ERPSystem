package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.domain.WbsNodeType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record WbsNodeResponse(
        UUID id,
        UUID projectId,
        UUID parentId,
        String code,
        String name,
        WbsNodeType nodeType,
        String nodeTypeDisplayName,
        Integer level,
        Integer sortOrder,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        Integer duration,
        BigDecimal percentComplete,
        UUID costCodeId,
        UUID responsibleId,
        Boolean isCritical,
        Integer totalFloat,
        Integer freeFloat,
        LocalDate earlyStart,
        LocalDate earlyFinish,
        LocalDate lateStart,
        LocalDate lateFinish,
        Instant createdAt,
        Instant updatedAt
) {
    public static WbsNodeResponse fromEntity(WbsNode node) {
        return new WbsNodeResponse(
                node.getId(),
                node.getProjectId(),
                node.getParentId(),
                node.getCode(),
                node.getName(),
                node.getNodeType(),
                node.getNodeType().getDisplayName(),
                node.getLevel(),
                node.getSortOrder(),
                node.getPlannedStartDate(),
                node.getPlannedEndDate(),
                node.getActualStartDate(),
                node.getActualEndDate(),
                node.getDuration(),
                node.getPercentComplete(),
                node.getCostCodeId(),
                node.getResponsibleId(),
                node.getIsCritical(),
                node.getTotalFloat(),
                node.getFreeFloat(),
                node.getEarlyStart(),
                node.getEarlyFinish(),
                node.getLateStart(),
                node.getLateFinish(),
                node.getCreatedAt(),
                node.getUpdatedAt()
        );
    }
}
