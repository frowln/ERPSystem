package com.privod.platform.modules.kep.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum KepProviderType {

    CRYPTO_PRO("КриптоПро"),
    VIPNET("ViPNet"),
    RUTOKEN("Рутокен"),
    JACARTA("JaCarta");

    private final String displayName;
}
