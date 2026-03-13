package com.privod.platform.infrastructure.dadata;

import lombok.Data;

/**
 * P2-CRM-1: Counterparty data resolved from DaData API.
 */
@Data
public class DaDataParty {
    /** ИНН */
    private String inn;
    /** КПП (null for ИП) */
    private String kpp;
    /** ОГРН / ОГРНИП */
    private String ogrn;
    /** OПФ краткое (ООО, АО, ИП, ...) */
    private String opf;
    /** Краткое наименование с ОПФ */
    private String shortName;
    /** Полное юридическое наименование */
    private String fullName;
    /** Юридический адрес */
    private String legalAddress;
    /** ФИО руководителя */
    private String directorName;
    /** Должность руководителя */
    private String directorPost;
    /** false если LIQUIDATED */
    private boolean active;
}
