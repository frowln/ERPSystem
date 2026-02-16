package com.privod.platform.modules.legal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LegalTemplateType {

    CONTRACT("Договор"),
    SUPPLEMENT("Дополнительное соглашение"),
    CLAIM("Претензия"),
    PRETRIAL_LETTER("Досудебное письмо"),
    POWER_OF_ATTORNEY("Доверенность");

    private final String displayName;
}
