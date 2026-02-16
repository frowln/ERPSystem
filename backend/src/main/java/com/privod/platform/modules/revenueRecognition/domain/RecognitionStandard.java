package com.privod.platform.modules.revenueRecognition.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RecognitionStandard {

    PBU_2_2008("ПБУ 2/2008"),
    FSBU_9_2025("ФСБУ 9/2025");

    private final String displayName;
}
