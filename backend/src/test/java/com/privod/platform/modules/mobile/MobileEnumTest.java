package com.privod.platform.modules.mobile;

import com.privod.platform.modules.mobile.domain.MobilePlatform;
import com.privod.platform.modules.mobile.domain.OfflineActionStatus;
import com.privod.platform.modules.mobile.domain.OfflineActionType;
import com.privod.platform.modules.mobile.domain.PushNotificationStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MobileEnumTest {

    @Test
    @DisplayName("MobilePlatform should have Russian display names")
    void mobilePlatform_HasRussianNames() {
        assertThat(MobilePlatform.IOS.getDisplayName()).isEqualTo("iOS");
        assertThat(MobilePlatform.ANDROID.getDisplayName()).isEqualTo("Android");
        assertThat(MobilePlatform.WEB.getDisplayName()).isEqualTo("Веб");
        assertThat(MobilePlatform.values()).hasSize(3);
    }

    @Test
    @DisplayName("PushNotificationStatus should have Russian display names")
    void pushNotificationStatus_HasRussianNames() {
        assertThat(PushNotificationStatus.PENDING.getDisplayName()).isEqualTo("Ожидание");
        assertThat(PushNotificationStatus.SENT.getDisplayName()).isEqualTo("Отправлено");
        assertThat(PushNotificationStatus.DELIVERED.getDisplayName()).isEqualTo("Доставлено");
        assertThat(PushNotificationStatus.FAILED.getDisplayName()).isEqualTo("Ошибка");
        assertThat(PushNotificationStatus.values()).hasSize(4);
    }

    @Test
    @DisplayName("OfflineActionType should have Russian display names")
    void offlineActionType_HasRussianNames() {
        assertThat(OfflineActionType.CREATE.getDisplayName()).isEqualTo("Создание");
        assertThat(OfflineActionType.UPDATE.getDisplayName()).isEqualTo("Обновление");
        assertThat(OfflineActionType.DELETE.getDisplayName()).isEqualTo("Удаление");
        assertThat(OfflineActionType.values()).hasSize(3);
    }

    @Test
    @DisplayName("OfflineActionStatus should have Russian display names")
    void offlineActionStatus_HasRussianNames() {
        assertThat(OfflineActionStatus.PENDING.getDisplayName()).isEqualTo("Ожидание");
        assertThat(OfflineActionStatus.SYNCED.getDisplayName()).isEqualTo("Синхронизировано");
        assertThat(OfflineActionStatus.CONFLICT.getDisplayName()).isEqualTo("Конфликт");
        assertThat(OfflineActionStatus.values()).hasSize(3);
    }
}
