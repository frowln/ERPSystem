package com.privod.platform.modules.ai.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AiProvider {
    YANDEX_GPT("Yandex GPT"),
    GIGACHAT("GigaChat"),
    SELF_HOSTED("Собственная модель"),
    OPENAI("OpenAI");

    private final String displayName;
}
