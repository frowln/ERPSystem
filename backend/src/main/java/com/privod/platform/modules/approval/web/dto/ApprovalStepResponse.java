package com.privod.platform.modules.approval.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalStepResponse {
    private UUID id;
    private Integer stepOrder;
    private String approverName;
    private String approverRole;
    private String status;
    private String comment;
    private Instant decidedAt;
    private Instant createdAt;
}
