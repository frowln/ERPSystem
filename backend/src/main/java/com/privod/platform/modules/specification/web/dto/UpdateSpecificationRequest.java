package com.privod.platform.modules.specification.web.dto;

import java.util.UUID;

public record UpdateSpecificationRequest(
        UUID contractId,

        String notes
) {
}
