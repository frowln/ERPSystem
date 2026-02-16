package com.privod.platform.modules.procurementExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum VehicleType {

    TRUCK("Грузовик"),
    VAN("Фургон"),
    TRAILER("Прицеп"),
    FLATBED("Бортовой"),
    TANKER("Цистерна"),
    CRANE("Кран"),
    OTHER("Другое");

    private final String displayName;
}
