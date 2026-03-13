package com.privod.platform.modules.bidManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Типы документов тендера (P2-CRM-2).
 */
@Getter
@RequiredArgsConstructor
public enum TenderDocumentType {

    INVITATION("Приглашение"),
    QUALIFICATION("Квалификационные требования"),
    TECHNICAL_SPEC("Техническое задание"),
    COMMERCIAL_PROPOSAL("Коммерческое предложение"),
    CONTRACT_DRAFT("Проект договора"),
    DRAWING("Чертёж"),
    ADDENDUM("Дополнение"),
    CLARIFICATION("Разъяснение"),
    AWARD_NOTICE("Уведомление о победителе");

    private final String displayName;
}
