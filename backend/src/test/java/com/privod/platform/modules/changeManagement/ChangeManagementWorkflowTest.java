package com.privod.platform.modules.changeManagement;

import com.privod.platform.modules.changeManagement.domain.ChangeEventStatus;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequestStatus;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Change Management Workflow - State Machine Tests")
class ChangeManagementWorkflowTest {

    @Nested
    @DisplayName("ChangeEventStatus Transitions")
    class ChangeEventStatusTests {

        @Test
        @DisplayName("Full happy-path: IDENTIFIED -> UNDER_REVIEW -> APPROVED_FOR_PRICING -> PRICED -> APPROVED")
        void fullHappyPath() {
            assertThat(ChangeEventStatus.IDENTIFIED.canTransitionTo(ChangeEventStatus.UNDER_REVIEW)).isTrue();
            assertThat(ChangeEventStatus.UNDER_REVIEW.canTransitionTo(ChangeEventStatus.APPROVED_FOR_PRICING)).isTrue();
            assertThat(ChangeEventStatus.APPROVED_FOR_PRICING.canTransitionTo(ChangeEventStatus.PRICED)).isTrue();
            assertThat(ChangeEventStatus.PRICED.canTransitionTo(ChangeEventStatus.APPROVED)).isTrue();
        }

        @Test
        @DisplayName("Rejection path: any review step can go to REJECTED")
        void rejectionPath() {
            assertThat(ChangeEventStatus.UNDER_REVIEW.canTransitionTo(ChangeEventStatus.REJECTED)).isTrue();
            assertThat(ChangeEventStatus.APPROVED_FOR_PRICING.canTransitionTo(ChangeEventStatus.REJECTED)).isTrue();
            assertThat(ChangeEventStatus.PRICED.canTransitionTo(ChangeEventStatus.REJECTED)).isTrue();
        }

        @Test
        @DisplayName("VOID can be reached from most active statuses")
        void voidPath() {
            assertThat(ChangeEventStatus.IDENTIFIED.canTransitionTo(ChangeEventStatus.VOID)).isTrue();
            assertThat(ChangeEventStatus.UNDER_REVIEW.canTransitionTo(ChangeEventStatus.VOID)).isTrue();
            assertThat(ChangeEventStatus.APPROVED_FOR_PRICING.canTransitionTo(ChangeEventStatus.VOID)).isTrue();
            assertThat(ChangeEventStatus.PRICED.canTransitionTo(ChangeEventStatus.VOID)).isTrue();
        }

        @Test
        @DisplayName("Terminal statuses cannot transition")
        void terminalStatuses() {
            assertThat(ChangeEventStatus.APPROVED.canTransitionTo(ChangeEventStatus.IDENTIFIED)).isFalse();
            assertThat(ChangeEventStatus.REJECTED.canTransitionTo(ChangeEventStatus.IDENTIFIED)).isFalse();
            assertThat(ChangeEventStatus.VOID.canTransitionTo(ChangeEventStatus.IDENTIFIED)).isFalse();
        }

        @Test
        @DisplayName("Skip transition: IDENTIFIED cannot go directly to APPROVED")
        void skipTransitionBlocked() {
            assertThat(ChangeEventStatus.IDENTIFIED.canTransitionTo(ChangeEventStatus.APPROVED)).isFalse();
            assertThat(ChangeEventStatus.IDENTIFIED.canTransitionTo(ChangeEventStatus.PRICED)).isFalse();
        }
    }

    @Nested
    @DisplayName("ChangeOrderRequestStatus Transitions")
    class ChangeOrderRequestStatusTests {

        @Test
        @DisplayName("Full happy-path: DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED")
        void fullHappyPath() {
            assertThat(ChangeOrderRequestStatus.DRAFT.canTransitionTo(ChangeOrderRequestStatus.SUBMITTED)).isTrue();
            assertThat(ChangeOrderRequestStatus.SUBMITTED.canTransitionTo(ChangeOrderRequestStatus.UNDER_REVIEW)).isTrue();
            assertThat(ChangeOrderRequestStatus.UNDER_REVIEW.canTransitionTo(ChangeOrderRequestStatus.APPROVED)).isTrue();
        }

        @Test
        @DisplayName("Rejection and revision cycle: UNDER_REVIEW -> REJECTED -> REVISED -> SUBMITTED")
        void rejectionRevisionCycle() {
            assertThat(ChangeOrderRequestStatus.UNDER_REVIEW.canTransitionTo(ChangeOrderRequestStatus.REJECTED)).isTrue();
            assertThat(ChangeOrderRequestStatus.REJECTED.canTransitionTo(ChangeOrderRequestStatus.REVISED)).isTrue();
            assertThat(ChangeOrderRequestStatus.REVISED.canTransitionTo(ChangeOrderRequestStatus.SUBMITTED)).isTrue();
        }

        @Test
        @DisplayName("APPROVED is terminal")
        void approvedIsTerminal() {
            assertThat(ChangeOrderRequestStatus.APPROVED.canTransitionTo(ChangeOrderRequestStatus.DRAFT)).isFalse();
            assertThat(ChangeOrderRequestStatus.APPROVED.canTransitionTo(ChangeOrderRequestStatus.SUBMITTED)).isFalse();
            assertThat(ChangeOrderRequestStatus.APPROVED.canTransitionTo(ChangeOrderRequestStatus.REJECTED)).isFalse();
        }

        @Test
        @DisplayName("DRAFT cannot go directly to APPROVED")
        void draftCannotGoDirectlyToApproved() {
            assertThat(ChangeOrderRequestStatus.DRAFT.canTransitionTo(ChangeOrderRequestStatus.APPROVED)).isFalse();
        }
    }

    @Nested
    @DisplayName("ChangeOrderStatus Transitions")
    class ChangeOrderStatusTests {

        @Test
        @DisplayName("Full happy-path: DRAFT -> PENDING_APPROVAL -> APPROVED -> EXECUTED")
        void fullHappyPath() {
            assertThat(ChangeOrderStatus.DRAFT.canTransitionTo(ChangeOrderStatus.PENDING_APPROVAL)).isTrue();
            assertThat(ChangeOrderStatus.PENDING_APPROVAL.canTransitionTo(ChangeOrderStatus.APPROVED)).isTrue();
            assertThat(ChangeOrderStatus.APPROVED.canTransitionTo(ChangeOrderStatus.EXECUTED)).isTrue();
        }

        @Test
        @DisplayName("VOID can be reached from active statuses")
        void voidPath() {
            assertThat(ChangeOrderStatus.DRAFT.canTransitionTo(ChangeOrderStatus.VOID)).isTrue();
            assertThat(ChangeOrderStatus.PENDING_APPROVAL.canTransitionTo(ChangeOrderStatus.VOID)).isTrue();
            assertThat(ChangeOrderStatus.APPROVED.canTransitionTo(ChangeOrderStatus.VOID)).isTrue();
        }

        @Test
        @DisplayName("Terminal statuses cannot transition")
        void terminalStatuses() {
            assertThat(ChangeOrderStatus.EXECUTED.canTransitionTo(ChangeOrderStatus.DRAFT)).isFalse();
            assertThat(ChangeOrderStatus.EXECUTED.canTransitionTo(ChangeOrderStatus.VOID)).isFalse();
            assertThat(ChangeOrderStatus.VOID.canTransitionTo(ChangeOrderStatus.DRAFT)).isFalse();
        }

        @Test
        @DisplayName("Skip transition: DRAFT cannot go directly to EXECUTED")
        void skipTransitionBlocked() {
            assertThat(ChangeOrderStatus.DRAFT.canTransitionTo(ChangeOrderStatus.EXECUTED)).isFalse();
            assertThat(ChangeOrderStatus.DRAFT.canTransitionTo(ChangeOrderStatus.APPROVED)).isFalse();
        }
    }

    @Nested
    @DisplayName("Enum Display Names")
    class EnumDisplayNameTests {

        @Test
        @DisplayName("All ChangeEventStatus values have Russian display names")
        void changeEventStatusDisplayNames() {
            assertThat(ChangeEventStatus.IDENTIFIED.getDisplayName()).isEqualTo("Выявлен");
            assertThat(ChangeEventStatus.UNDER_REVIEW.getDisplayName()).isEqualTo("На рассмотрении");
            assertThat(ChangeEventStatus.APPROVED_FOR_PRICING.getDisplayName()).isEqualTo("Утверждён для расценки");
            assertThat(ChangeEventStatus.PRICED.getDisplayName()).isEqualTo("Расценён");
            assertThat(ChangeEventStatus.APPROVED.getDisplayName()).isEqualTo("Утверждён");
            assertThat(ChangeEventStatus.REJECTED.getDisplayName()).isEqualTo("Отклонён");
            assertThat(ChangeEventStatus.VOID.getDisplayName()).isEqualTo("Аннулирован");
        }

        @Test
        @DisplayName("All ChangeOrderStatus values have Russian display names")
        void changeOrderStatusDisplayNames() {
            assertThat(ChangeOrderStatus.DRAFT.getDisplayName()).isEqualTo("Черновик");
            assertThat(ChangeOrderStatus.PENDING_APPROVAL.getDisplayName()).isEqualTo("Ожидает утверждения");
            assertThat(ChangeOrderStatus.APPROVED.getDisplayName()).isEqualTo("Утверждён");
            assertThat(ChangeOrderStatus.EXECUTED.getDisplayName()).isEqualTo("Исполнен");
            assertThat(ChangeOrderStatus.VOID.getDisplayName()).isEqualTo("Аннулирован");
        }
    }
}
