package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.DesignDiscipline;
import com.privod.platform.modules.bim.domain.DesignPackageStatus;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateDesignPackageRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        DesignDiscipline discipline,
        DesignPackageStatus status,
        UUID approvedById
) {
}
