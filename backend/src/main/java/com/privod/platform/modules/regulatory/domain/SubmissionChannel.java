package com.privod.platform.modules.regulatory.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SubmissionChannel {

    ELECTRONIC("Электронно"),
    PAPER("На бумаге"),
    EDO("ЭДО");

    private final String displayName;
}
