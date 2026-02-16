package com.privod.platform.modules.ai;

import com.privod.platform.modules.ai.domain.AnalysisStatus;
import com.privod.platform.modules.ai.domain.AnalysisType;
import com.privod.platform.modules.ai.domain.ConversationStatus;
import com.privod.platform.modules.ai.domain.MessageRole;
import com.privod.platform.modules.ai.domain.PredictionType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AiEnumTest {

    @Test
    @DisplayName("ConversationStatus should have Russian display names")
    void conversationStatus_HasRussianNames() {
        assertThat(ConversationStatus.ACTIVE.getDisplayName()).isEqualTo("Активный");
        assertThat(ConversationStatus.ARCHIVED.getDisplayName()).isEqualTo("Архивный");
        assertThat(ConversationStatus.values()).hasSize(2);
    }

    @Test
    @DisplayName("MessageRole should have Russian display names")
    void messageRole_HasRussianNames() {
        assertThat(MessageRole.USER.getDisplayName()).isEqualTo("Пользователь");
        assertThat(MessageRole.ASSISTANT.getDisplayName()).isEqualTo("Ассистент");
        assertThat(MessageRole.SYSTEM.getDisplayName()).isEqualTo("Системное");
        assertThat(MessageRole.values()).hasSize(3);
    }

    @Test
    @DisplayName("AnalysisType should have Russian display names")
    void analysisType_HasRussianNames() {
        assertThat(AnalysisType.SUMMARY.getDisplayName()).isEqualTo("Резюме");
        assertThat(AnalysisType.EXTRACT_DATA.getDisplayName()).isEqualTo("Извлечение данных");
        assertThat(AnalysisType.CLASSIFY.getDisplayName()).isEqualTo("Классификация");
        assertThat(AnalysisType.COMPARE.getDisplayName()).isEqualTo("Сравнение");
        assertThat(AnalysisType.values()).hasSize(4);
    }

    @Test
    @DisplayName("AnalysisStatus should have Russian display names")
    void analysisStatus_HasRussianNames() {
        assertThat(AnalysisStatus.PENDING.getDisplayName()).isEqualTo("Ожидание");
        assertThat(AnalysisStatus.PROCESSING.getDisplayName()).isEqualTo("Обработка");
        assertThat(AnalysisStatus.COMPLETED.getDisplayName()).isEqualTo("Завершён");
        assertThat(AnalysisStatus.FAILED.getDisplayName()).isEqualTo("Ошибка");
        assertThat(AnalysisStatus.values()).hasSize(4);
    }

    @Test
    @DisplayName("PredictionType should have Russian display names")
    void predictionType_HasRussianNames() {
        assertThat(PredictionType.COST.getDisplayName()).isEqualTo("Стоимость");
        assertThat(PredictionType.DURATION.getDisplayName()).isEqualTo("Длительность");
        assertThat(PredictionType.RISK.getDisplayName()).isEqualTo("Риск");
        assertThat(PredictionType.RESOURCE.getDisplayName()).isEqualTo("Ресурс");
        assertThat(PredictionType.values()).hasSize(4);
    }
}
