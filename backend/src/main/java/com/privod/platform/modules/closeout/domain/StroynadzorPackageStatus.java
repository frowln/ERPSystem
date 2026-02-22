package com.privod.platform.modules.closeout.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum StroynadzorPackageStatus {

    DRAFT("Черновик"),
    GENERATING("Формируется"),
    READY("Готов"),
    SENT("Отправлен"),
    ERROR("Ошибка");

    private final String displayName;
}
