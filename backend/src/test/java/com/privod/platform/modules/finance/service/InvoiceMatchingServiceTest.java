package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.InvoiceLineRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceMatchingServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private InvoiceLineRepository invoiceLineRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private BudgetItemRepository budgetItemRepository;
    @Mock
    private BudgetRepository budgetRepository;

    @InjectMocks
    private InvoiceMatchingService service;

    private MockedStatic<SecurityUtils> securityUtilsMock;

    private final UUID organizationId = UUID.randomUUID();
    private final UUID projectId = UUID.randomUUID();
    private final UUID budgetId = UUID.randomUUID();
    private final UUID budgetItemId = UUID.randomUUID();
    private final UUID invoiceId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        securityUtilsMock = mockStatic(SecurityUtils.class);
        securityUtilsMock.when(SecurityUtils::requireCurrentOrganizationId).thenReturn(organizationId);
    }

    @AfterEach
    void tearDown() {
        securityUtilsMock.close();
    }

    @Test
    @DisplayName("findMatching excludes lines already selected by other CP items")
    void excludesLinesSelectedByOtherCpItems() {
        UUID otherCpItemId = UUID.randomUUID();
        var data = baseData();

        var foreignSelected = data.line(
                new BigDecimal("100"),
                new BigDecimal("80"),
                true,
                otherCpItemId
        );
        var free = data.line(
                new BigDecimal("100"),
                new BigDecimal("90"),
                false,
                null
        );

        when(invoiceLineRepository.findByInvoiceIdAndDeletedFalseOrderBySequenceAsc(invoiceId))
                .thenReturn(List.of(foreignSelected, free));

        var result = service.findMatchingInvoiceLines(budgetItemId, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(free.getId());
    }

    @Test
    @DisplayName("findMatching includes line already selected for the same CP item")
    void includesLineSelectedForSameCpItem() {
        UUID currentCpItemId = UUID.randomUUID();
        var data = baseData();

        var sameCpSelected = data.line(
                new BigDecimal("100"),
                new BigDecimal("95"),
                true,
                currentCpItemId
        );
        var free = data.line(
                new BigDecimal("90"),
                new BigDecimal("90"),
                false,
                null
        );

        when(invoiceLineRepository.findByInvoiceIdAndDeletedFalseOrderBySequenceAsc(invoiceId))
                .thenReturn(List.of(free, sameCpSelected));

        var result = service.findMatchingInvoiceLines(budgetItemId, null, currentCpItemId);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(sameCpSelected.getId());
    }

    @Test
    @DisplayName("findMatching prioritizes quantity-closest line when score ties")
    void prioritizesQuantityClosestLine() {
        var data = baseData();

        var closeQty = data.line(
                new BigDecimal("100"),
                new BigDecimal("110"),
                false,
                null
        );
        var farQtyCheaper = data.line(
                new BigDecimal("40"),
                new BigDecimal("90"),
                false,
                null
        );

        when(invoiceLineRepository.findByInvoiceIdAndDeletedFalseOrderBySequenceAsc(invoiceId))
                .thenReturn(List.of(farQtyCheaper, closeQty));

        var result = service.findMatchingInvoiceLines(budgetItemId, null, null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(closeQty.getId());
    }

    private Fixture baseData() {
        Budget budget = Budget.builder()
                .organizationId(organizationId)
                .name("Бюджет")
                .projectId(projectId)
                .build();
        budget.setId(budgetId);

        BudgetItem budgetItem = BudgetItem.builder()
                .budgetId(budgetId)
                .name("Кабель ВВГнг-LS 5x16")
                .unit("м")
                .quantity(new BigDecimal("100"))
                .build();
        budgetItem.setId(budgetItemId);

        Invoice invoice = Invoice.builder()
                .organizationId(organizationId)
                .invoiceDate(LocalDate.of(2026, 2, 21))
                .projectId(projectId)
                .invoiceType(InvoiceType.RECEIVED)
                .totalAmount(new BigDecimal("10000"))
                .build();
        invoice.setId(invoiceId);

        when(budgetItemRepository.findById(budgetItemId)).thenReturn(Optional.of(budgetItem));
        when(budgetRepository.findByIdAndOrganizationIdAndDeletedFalse(budgetId, organizationId))
                .thenReturn(Optional.of(budget));
        when(invoiceRepository.findAll(org.mockito.ArgumentMatchers.<Specification<Invoice>>any()))
                .thenReturn(List.of(invoice));

        return new Fixture(invoice);
    }

    private final class Fixture {
        private final Invoice invoice;

        private Fixture(Invoice invoice) {
            this.invoice = invoice;
        }

        private com.privod.platform.modules.finance.domain.InvoiceLine line(
                BigDecimal quantity,
                BigDecimal unitPrice,
                boolean selectedForCp,
                UUID cpItemId
        ) {
            com.privod.platform.modules.finance.domain.InvoiceLine line =
                    com.privod.platform.modules.finance.domain.InvoiceLine.builder()
                            .invoiceId(invoice.getId())
                            .name("Кабель ВВГнг-LS 5x16")
                            .quantity(quantity)
                            .unitOfMeasure("м")
                            .unitPrice(unitPrice)
                            .amount(quantity.multiply(unitPrice))
                            .selectedForCp(selectedForCp)
                            .cpItemId(cpItemId)
                            .build();
            line.setId(UUID.randomUUID());
            return line;
        }
    }
}
