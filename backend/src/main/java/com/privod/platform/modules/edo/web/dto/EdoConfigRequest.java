package com.privod.platform.modules.edo.web.dto;

import com.privod.platform.modules.edo.domain.EdoProvider;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EdoConfigRequest(

        @NotNull(message = "Провайдер ЭДО обязателен")
        EdoProvider provider,

        @Size(max = 500, message = "API ключ не должен превышать 500 символов")
        String apiKey,

        @Size(max = 100, message = "Box ID не должен превышать 100 символов")
        String boxId,

        @Size(max = 12, message = "ИНН не должен превышать 12 символов")
        String inn,

        @Size(max = 9, message = "КПП не должен превышать 9 символов")
        String kpp,

        Boolean enabled
) {
}
