package com.privod.platform.modules.hrRussian.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContractType {

    СРОЧНЫЙ("Срочный трудовой договор"),
    БЕССРОЧНЫЙ("Бессрочный трудовой договор"),
    ГПХ("Договор гражданско-правового характера");

    private final String displayName;
}
