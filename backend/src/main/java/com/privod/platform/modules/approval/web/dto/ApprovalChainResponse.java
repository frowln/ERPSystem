package com.privod.platform.modules.approval.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalChainResponse {
    private UUID id;
    private String entityType;
    private UUID entityId;
    private String name;
    private String status;
    private List<ApprovalStepResponse> steps;
    private Instant createdAt;
}
