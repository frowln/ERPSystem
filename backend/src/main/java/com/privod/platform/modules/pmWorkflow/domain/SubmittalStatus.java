package com.privod.platform.modules.pmWorkflow.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SubmittalStatus {

    DRAFT("Черновик"),
    SUBMITTED("Отправлен на рассмотрение"),
    UNDER_REVIEW("На рассмотрении"),
    APPROVED("Утверждён"),
    APPROVED_AS_NOTED("Утверждён с замечаниями"),
    REJECTED("Отклонён"),
    RESUBMITTED("Повторно отправлен"),
    CLOSED("Закрыт");

    private final String displayName;

    public boolean canTransitionTo(SubmittalStatus target) {
        return switch (this) {
            case DRAFT -> target == SUBMITTED;
            case SUBMITTED -> target == UNDER_REVIEW;
            case UNDER_REVIEW -> target == APPROVED || target == APPROVED_AS_NOTED || target == REJECTED;
            case APPROVED -> target == CLOSED;
            case APPROVED_AS_NOTED -> target == CLOSED || target == RESUBMITTED;
            case REJECTED -> target == RESUBMITTED;
            case RESUBMITTED -> target == UNDER_REVIEW;
            case CLOSED -> false;
        };
    }
}
