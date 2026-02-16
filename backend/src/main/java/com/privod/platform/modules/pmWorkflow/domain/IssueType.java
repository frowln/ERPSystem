package com.privod.platform.modules.pmWorkflow.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IssueType {

    DESIGN("Проектный"),
    CONSTRUCTION("Строительный"),
    COORDINATION("Координация"),
    SAFETY("Безопасность"),
    QUALITY("Качество"),
    OTHER("Прочее");

    private final String displayName;
}
