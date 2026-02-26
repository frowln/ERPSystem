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

    public boolean canTransitionTo(ProposalStatus target) {
        if (target == null) {
            return false;
        }
        if (this == target) {
            return true;
        }
        return switch (this) {
            case DRAFT -> target == IN_REVIEW;
            case IN_REVIEW -> target == DRAFT || target == APPROVED;
            case APPROVED -> target == ACTIVE;
            case ACTIVE -> false;
        };
    }
}
