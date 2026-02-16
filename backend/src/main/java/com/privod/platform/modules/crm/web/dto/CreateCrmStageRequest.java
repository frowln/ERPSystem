package com.privod.platform.modules.crm.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCrmStageRequest(
        @NotBlank(message = "Название этапа обязательно")
        @Size(max = 200)
        String name,

        int sequence,

        int probability,

        Boolean closed,

        Boolean won,

        String requirements
) {
}
