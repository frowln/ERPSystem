package com.privod.platform.modules.commercialProposal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ProposalStatus {
    DRAFT("Черновик"),
    IN_REVIEW("На рассмотрении"),
    APPROVED("Утверждено"),
    ACTIVE("Активно");

    private final String displayName;
}
