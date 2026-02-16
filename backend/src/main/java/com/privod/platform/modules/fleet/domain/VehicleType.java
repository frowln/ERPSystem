package com.privod.platform.modules.fleet.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum VehicleType {

    EXCAVATOR("Экскаватор"),
    BULLDOZER("Бульдозер"),
    CRANE("Кран"),
    TRUCK("Грузовик"),
    CONCRETE_MIXER("Бетономешалка"),
    LOADER("Погрузчик"),
    ROLLER("Каток"),
    GENERATOR("Генератор"),
    COMPRESSOR("Компрессор"),
    WELDING("Сварочный аппарат"),
    CAR("Легковой автомобиль"),
    BUS("Автобус"),
    OTHER("Прочее");

    private final String displayName;
}
