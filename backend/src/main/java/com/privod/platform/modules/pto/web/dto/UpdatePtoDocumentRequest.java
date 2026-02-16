package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.Discipline;
import jakarta.validation.constraints.Size;

public record UpdatePtoDocumentRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        Discipline discipline,

        String notes
) {
}
