package com.privod.platform.modules.ops.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FieldInstructionStatus {

    DRAFT("Черновик"),
    ISSUED("Выдано"),
    ACKNOWLEDGED("Принято"),
    IN_PROGRESS("В работе"),
    RESPONDED("Дан ответ"),
    CLOSED("Закрыто");

    private final String displayName;

    public boolean canTransitionTo(FieldInstructionStatus target) {
        return switch (this) {
            case DRAFT -> target == ISSUED;
            case ISSUED -> target == ACKNOWLEDGED || target == CLOSED;
            case ACKNOWLEDGED -> target == IN_PROGRESS || target == RESPONDED;
            case IN_PROGRESS -> target == RESPONDED;
            case RESPONDED -> target == CLOSED;
            case CLOSED -> false;
        };
    }
}
