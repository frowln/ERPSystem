package com.privod.platform.modules.bim.web.dto;

import jakarta.validation.constraints.Size;

public record BimDefectFilterRequest(
        @Size(max = 200, message = "Фильтр этажа не должен превышать 200 символов")
        String floorName,

        @Size(max = 200, message = "Фильтр системы не должен превышать 200 символов")
        String systemName,

        @Size(max = 200, message = "Фильтр типа элемента не должен превышать 200 символов")
        String elementType,

        @Size(max = 30, message = "Статус дефекта не должен превышать 30 символов")
        String defectStatus
) {
}
