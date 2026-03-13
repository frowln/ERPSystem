package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.EnumSet;
import java.util.Set;

@Getter
@RequiredArgsConstructor
public enum NonConformanceStatus {

    OPEN("Открыто") {
        @Override public Set<NonConformanceStatus> allowedTransitions() {
            return EnumSet.of(INVESTIGATING, CLOSED);
        }
    },
    INVESTIGATING("Расследование") {
        @Override public Set<NonConformanceStatus> allowedTransitions() {
            return EnumSet.of(CORRECTIVE_ACTION, OPEN);
        }
    },
    CORRECTIVE_ACTION("Корректирующее действие") {
        @Override public Set<NonConformanceStatus> allowedTransitions() {
            return EnumSet.of(VERIFIED, INVESTIGATING);
        }
    },
    VERIFIED("Проверено") {
        @Override public Set<NonConformanceStatus> allowedTransitions() {
            return EnumSet.of(CLOSED, CORRECTIVE_ACTION);
        }
    },
    CLOSED("Закрыто") {
        @Override public Set<NonConformanceStatus> allowedTransitions() {
            return EnumSet.noneOf(NonConformanceStatus.class);
        }
    };

    private final String displayName;

    public abstract Set<NonConformanceStatus> allowedTransitions();

    public boolean canTransitionTo(NonConformanceStatus next) {
        return allowedTransitions().contains(next);
    }
}
