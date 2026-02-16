package com.privod.platform.modules.legal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RemarkType {

    INTERNAL_NOTE("Внутренняя заметка"),
    LAWYER_OPINION("Мнение юриста"),
    EXPERT_CONCLUSION("Заключение эксперта"),
    CLIENT_INSTRUCTION("Указание клиента");

    private final String displayName;
}
