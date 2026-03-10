package com.privod.platform.modules.approval.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApprovalChainRequest {

    private String name;

    @NotBlank
    private String entityType;

    @NotNull
    private UUID entityId;

    @NotEmpty
    @Valid
    private List<StepData> steps;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StepData {
        @NotBlank
        private String approverName;
        private String approverRole;
    }
}
