package com.privod.platform.modules.esg.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EsgReportType {

    PROJECT("По проекту"),
    PORTFOLIO("По портфелю"),
    ANNUAL("Годовой");

    private final String displayName;
}
