package com.privod.platform.modules.recruitment.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ApplicantStatus {

    NEW("Новый"),
    INITIAL_QUALIFICATION("Первичная квалификация"),
    FIRST_INTERVIEW("Первое собеседование"),
    SECOND_INTERVIEW("Второе собеседование"),
    CONTRACT_PROPOSAL("Предложение контракта"),
    WON("Принят"),
    REFUSED("Отказано");

    private final String displayName;
}
