package com.privod.platform.modules.pmWorkflow;

import com.privod.platform.modules.pmWorkflow.domain.IssueStatus;
import com.privod.platform.modules.pmWorkflow.domain.RfiStatus;
import com.privod.platform.modules.pmWorkflow.domain.SubmittalStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PmWorkflowEnumTest {

    @Nested
    @DisplayName("RfiStatus transitions")
    class RfiStatusTests {

        @Test
        @DisplayName("DRAFT can only transition to OPEN")
        void draftTransitions() {
            assertThat(RfiStatus.DRAFT.canTransitionTo(RfiStatus.OPEN)).isTrue();
            assertThat(RfiStatus.DRAFT.canTransitionTo(RfiStatus.ASSIGNED)).isFalse();
            assertThat(RfiStatus.DRAFT.canTransitionTo(RfiStatus.ANSWERED)).isFalse();
            assertThat(RfiStatus.DRAFT.canTransitionTo(RfiStatus.CLOSED)).isFalse();
            assertThat(RfiStatus.DRAFT.canTransitionTo(RfiStatus.VOID)).isFalse();
        }

        @Test
        @DisplayName("CLOSED and VOID are terminal states")
        void terminalStates() {
            for (RfiStatus target : RfiStatus.values()) {
                assertThat(RfiStatus.CLOSED.canTransitionTo(target)).isFalse();
                assertThat(RfiStatus.VOID.canTransitionTo(target)).isFalse();
            }
        }

        @Test
        @DisplayName("ANSWERED can transition to CLOSED or OPEN")
        void answeredTransitions() {
            assertThat(RfiStatus.ANSWERED.canTransitionTo(RfiStatus.CLOSED)).isTrue();
            assertThat(RfiStatus.ANSWERED.canTransitionTo(RfiStatus.OPEN)).isTrue();
            assertThat(RfiStatus.ANSWERED.canTransitionTo(RfiStatus.DRAFT)).isFalse();
        }

        @Test
        @DisplayName("All enums have Russian display names")
        void displayNames() {
            for (RfiStatus s : RfiStatus.values()) {
                assertThat(s.getDisplayName()).isNotBlank();
            }
        }
    }

    @Nested
    @DisplayName("SubmittalStatus transitions")
    class SubmittalStatusTests {

        @Test
        @DisplayName("DRAFT can only transition to SUBMITTED")
        void draftTransitions() {
            assertThat(SubmittalStatus.DRAFT.canTransitionTo(SubmittalStatus.SUBMITTED)).isTrue();
            assertThat(SubmittalStatus.DRAFT.canTransitionTo(SubmittalStatus.APPROVED)).isFalse();
            assertThat(SubmittalStatus.DRAFT.canTransitionTo(SubmittalStatus.CLOSED)).isFalse();
        }

        @Test
        @DisplayName("UNDER_REVIEW can transition to APPROVED, APPROVED_AS_NOTED, or REJECTED")
        void underReviewTransitions() {
            assertThat(SubmittalStatus.UNDER_REVIEW.canTransitionTo(SubmittalStatus.APPROVED)).isTrue();
            assertThat(SubmittalStatus.UNDER_REVIEW.canTransitionTo(SubmittalStatus.APPROVED_AS_NOTED)).isTrue();
            assertThat(SubmittalStatus.UNDER_REVIEW.canTransitionTo(SubmittalStatus.REJECTED)).isTrue();
            assertThat(SubmittalStatus.UNDER_REVIEW.canTransitionTo(SubmittalStatus.CLOSED)).isFalse();
        }

        @Test
        @DisplayName("CLOSED is terminal state")
        void closedIsTerminal() {
            for (SubmittalStatus target : SubmittalStatus.values()) {
                assertThat(SubmittalStatus.CLOSED.canTransitionTo(target)).isFalse();
            }
        }
    }

    @Nested
    @DisplayName("IssueStatus transitions")
    class IssueStatusTests {

        @Test
        @DisplayName("OPEN can transition to IN_PROGRESS or CLOSED")
        void openTransitions() {
            assertThat(IssueStatus.OPEN.canTransitionTo(IssueStatus.IN_PROGRESS)).isTrue();
            assertThat(IssueStatus.OPEN.canTransitionTo(IssueStatus.CLOSED)).isTrue();
            assertThat(IssueStatus.OPEN.canTransitionTo(IssueStatus.RESOLVED)).isFalse();
            assertThat(IssueStatus.OPEN.canTransitionTo(IssueStatus.REOPENED)).isFalse();
        }

        @Test
        @DisplayName("CLOSED can only transition to REOPENED")
        void closedTransitions() {
            assertThat(IssueStatus.CLOSED.canTransitionTo(IssueStatus.REOPENED)).isTrue();
            assertThat(IssueStatus.CLOSED.canTransitionTo(IssueStatus.OPEN)).isFalse();
            assertThat(IssueStatus.CLOSED.canTransitionTo(IssueStatus.IN_PROGRESS)).isFalse();
        }

        @Test
        @DisplayName("REOPENED can transition to IN_PROGRESS or CLOSED")
        void reopenedTransitions() {
            assertThat(IssueStatus.REOPENED.canTransitionTo(IssueStatus.IN_PROGRESS)).isTrue();
            assertThat(IssueStatus.REOPENED.canTransitionTo(IssueStatus.CLOSED)).isTrue();
            assertThat(IssueStatus.REOPENED.canTransitionTo(IssueStatus.RESOLVED)).isFalse();
        }

        @Test
        @DisplayName("All IssueStatus enums have Russian display names")
        void displayNames() {
            for (IssueStatus s : IssueStatus.values()) {
                assertThat(s.getDisplayName()).isNotBlank();
            }
        }
    }
}
