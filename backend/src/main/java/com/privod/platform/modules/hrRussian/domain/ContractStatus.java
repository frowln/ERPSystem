package com.privod.platform.modules.hrRussian.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContractStatus {

    ACTIVE("Действующий"),
    TERMINATED("Расторгнут"),
    SUSPENDED("Приостановлен"),
    EXPIRED("Истёк");

    private final String displayName;
}
