package com.privod.platform.modules.cde;

import com.privod.platform.modules.cde.domain.DocumentLifecycleState;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DocumentLifecycleStateTest {

    @Test
    @DisplayName("ISO 19650: WIP -> SHARED допускается")
    void wipToShared_Allowed() {
        assertThat(DocumentLifecycleState.WIP.canTransitionTo(DocumentLifecycleState.SHARED)).isTrue();
    }

    @Test
    @DisplayName("ISO 19650: SHARED -> PUBLISHED допускается")
    void sharedToPublished_Allowed() {
        assertThat(DocumentLifecycleState.SHARED.canTransitionTo(DocumentLifecycleState.PUBLISHED)).isTrue();
    }

    @Test
    @DisplayName("ISO 19650: PUBLISHED -> ARCHIVED допускается")
    void publishedToArchived_Allowed() {
        assertThat(DocumentLifecycleState.PUBLISHED.canTransitionTo(DocumentLifecycleState.ARCHIVED)).isTrue();
    }

    @Test
    @DisplayName("ISO 19650: обратный переход SHARED -> WIP запрещён")
    void sharedToWip_NotAllowed() {
        assertThat(DocumentLifecycleState.SHARED.canTransitionTo(DocumentLifecycleState.WIP)).isFalse();
    }

    @Test
    @DisplayName("ISO 19650: обратный переход PUBLISHED -> SHARED запрещён")
    void publishedToShared_NotAllowed() {
        assertThat(DocumentLifecycleState.PUBLISHED.canTransitionTo(DocumentLifecycleState.SHARED)).isFalse();
    }

    @Test
    @DisplayName("ISO 19650: пропуск состояния WIP -> PUBLISHED запрещён")
    void wipToPublished_NotAllowed() {
        assertThat(DocumentLifecycleState.WIP.canTransitionTo(DocumentLifecycleState.PUBLISHED)).isFalse();
    }

    @Test
    @DisplayName("ISO 19650: переход из ARCHIVED запрещён")
    void archivedToAnything_NotAllowed() {
        assertThat(DocumentLifecycleState.ARCHIVED.canTransitionTo(DocumentLifecycleState.WIP)).isFalse();
        assertThat(DocumentLifecycleState.ARCHIVED.canTransitionTo(DocumentLifecycleState.SHARED)).isFalse();
        assertThat(DocumentLifecycleState.ARCHIVED.canTransitionTo(DocumentLifecycleState.PUBLISHED)).isFalse();
    }

    @Test
    @DisplayName("Отображаемые имена на русском языке")
    void displayNames_AreInRussian() {
        assertThat(DocumentLifecycleState.WIP.getDisplayName()).isEqualTo("В работе");
        assertThat(DocumentLifecycleState.SHARED.getDisplayName()).isEqualTo("Общий доступ");
        assertThat(DocumentLifecycleState.PUBLISHED.getDisplayName()).isEqualTo("Опубликован");
        assertThat(DocumentLifecycleState.ARCHIVED.getDisplayName()).isEqualTo("Архив");
    }
}
