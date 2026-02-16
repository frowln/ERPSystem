import { describe, it, expect } from 'vitest';
import {
  projectStatusColorMap,
  contractStatusColorMap,
  paymentStatusColorMap,
  invoiceStatusColorMap,
  budgetStatusColorMap,
  priorityColorMap,
  stockMovementStatusColorMap,
  stockMovementTypeColorMap,
  purchaseRequestStatusColorMap,
  employeeStatusColorMap,
  materialCategoryColorMap,
  specificationStatusColorMap,
  estimateStatusColorMap,
} from './index';

describe('StatusBadge color maps', () => {
  describe('projectStatusColorMap', () => {
    it('maps all project statuses', () => {
      expect(projectStatusColorMap.DRAFT).toBe('gray');
      expect(projectStatusColorMap.PLANNING).toBe('blue');
      expect(projectStatusColorMap.IN_PROGRESS).toBe('green');
      expect(projectStatusColorMap.ON_HOLD).toBe('yellow');
      expect(projectStatusColorMap.COMPLETED).toBe('purple');
      expect(projectStatusColorMap.CANCELLED).toBe('red');
    });

    it('has exactly 6 statuses', () => {
      expect(Object.keys(projectStatusColorMap)).toHaveLength(6);
    });
  });

  describe('contractStatusColorMap', () => {
    it('maps all contract statuses', () => {
      expect(contractStatusColorMap.DRAFT).toBe('gray');
      expect(contractStatusColorMap.ACTIVE).toBe('green');
      expect(contractStatusColorMap.SIGNED).toBe('purple');
      expect(contractStatusColorMap.REJECTED).toBe('red');
    });

    it('includes approval chain statuses', () => {
      expect(contractStatusColorMap.ON_APPROVAL).toBe('yellow');
      expect(contractStatusColorMap.LAWYER_APPROVED).toBe('cyan');
      expect(contractStatusColorMap.MANAGEMENT_APPROVED).toBe('cyan');
      expect(contractStatusColorMap.FINANCE_APPROVED).toBe('cyan');
    });
  });

  describe('paymentStatusColorMap', () => {
    it('maps payment statuses with correct severity colors', () => {
      expect(paymentStatusColorMap.PAID).toBe('green');
      expect(paymentStatusColorMap.OVERDUE).toBe('red');
      expect(paymentStatusColorMap.PENDING).toBe('yellow');
    });
  });

  describe('invoiceStatusColorMap', () => {
    it('maps invoice lifecycle statuses', () => {
      expect(invoiceStatusColorMap.DRAFT).toBe('gray');
      expect(invoiceStatusColorMap.SENT).toBe('blue');
      expect(invoiceStatusColorMap.PARTIALLY_PAID).toBe('orange');
      expect(invoiceStatusColorMap.PAID).toBe('green');
      expect(invoiceStatusColorMap.OVERDUE).toBe('red');
    });
  });

  describe('budgetStatusColorMap', () => {
    it('maps budget workflow statuses', () => {
      expect(budgetStatusColorMap.DRAFT).toBe('gray');
      expect(budgetStatusColorMap.APPROVED).toBe('blue');
      expect(budgetStatusColorMap.ACTIVE).toBe('green');
      expect(budgetStatusColorMap.FROZEN).toBe('orange');
    });
  });

  describe('priorityColorMap', () => {
    it('escalates colors from gray to red', () => {
      expect(priorityColorMap.LOW).toBe('gray');
      expect(priorityColorMap.NORMAL).toBe('blue');
      expect(priorityColorMap.HIGH).toBe('orange');
      expect(priorityColorMap.CRITICAL).toBe('red');
    });
  });

  describe('stockMovementStatusColorMap', () => {
    it('maps warehouse movement statuses', () => {
      expect(stockMovementStatusColorMap.DRAFT).toBe('gray');
      expect(stockMovementStatusColorMap.CONFIRMED).toBe('blue');
      expect(stockMovementStatusColorMap.DONE).toBe('green');
      expect(stockMovementStatusColorMap.CANCELLED).toBe('gray');
    });
  });

  describe('stockMovementTypeColorMap', () => {
    it('distinguishes inbound/outbound by color', () => {
      expect(stockMovementTypeColorMap.RECEIPT).toBe('green');
      expect(stockMovementTypeColorMap.ISSUE).toBe('red');
      expect(stockMovementTypeColorMap.TRANSFER).toBe('blue');
      expect(stockMovementTypeColorMap.WRITE_OFF).toBe('gray');
    });
  });

  describe('purchaseRequestStatusColorMap', () => {
    it('maps procurement workflow', () => {
      expect(purchaseRequestStatusColorMap.DRAFT).toBe('gray');
      expect(purchaseRequestStatusColorMap.SUBMITTED).toBe('yellow');
      expect(purchaseRequestStatusColorMap.APPROVED).toBe('blue');
      expect(purchaseRequestStatusColorMap.ORDERED).toBe('purple');
      expect(purchaseRequestStatusColorMap.DELIVERED).toBe('green');
    });
  });

  describe('employeeStatusColorMap', () => {
    it('maps HR statuses', () => {
      expect(employeeStatusColorMap.ACTIVE).toBe('green');
      expect(employeeStatusColorMap.ON_LEAVE).toBe('yellow');
      expect(employeeStatusColorMap.TERMINATED).toBe('gray');
      expect(employeeStatusColorMap.SUSPENDED).toBe('red');
    });
  });

  describe('materialCategoryColorMap', () => {
    it('maps material categories', () => {
      expect(materialCategoryColorMap.CONCRETE).toBe('gray');
      expect(materialCategoryColorMap.METAL).toBe('blue');
      expect(materialCategoryColorMap.ELECTRICAL).toBe('red');
    });

    it('covers all 10 categories', () => {
      expect(Object.keys(materialCategoryColorMap)).toHaveLength(10);
    });
  });

  describe('specificationStatusColorMap', () => {
    it('maps spec lifecycle', () => {
      expect(specificationStatusColorMap.DRAFT).toBe('gray');
      expect(specificationStatusColorMap.IN_REVIEW).toBe('yellow');
      expect(specificationStatusColorMap.APPROVED).toBe('blue');
      expect(specificationStatusColorMap.ACTIVE).toBe('green');
    });
  });

  describe('estimateStatusColorMap', () => {
    it('maps estimate statuses', () => {
      expect(estimateStatusColorMap.DRAFT).toBe('gray');
      expect(estimateStatusColorMap.IN_WORK).toBe('yellow');
      expect(estimateStatusColorMap.APPROVED).toBe('blue');
      expect(estimateStatusColorMap.ACTIVE).toBe('green');
    });
  });

  describe('color consistency across all maps', () => {
    it('DRAFT is always gray', () => {
      const mapsWithDraft = [
        projectStatusColorMap,
        contractStatusColorMap,
        budgetStatusColorMap,
        invoiceStatusColorMap,
        stockMovementStatusColorMap,
        purchaseRequestStatusColorMap,
        specificationStatusColorMap,
        estimateStatusColorMap,
      ];

      for (const map of mapsWithDraft) {
        expect(map.DRAFT).toBe('gray');
      }
    });

    it('CANCELLED is always gray or red', () => {
      const mapsWithCancelled = [
        projectStatusColorMap,
        contractStatusColorMap,
        paymentStatusColorMap,
        invoiceStatusColorMap,
        stockMovementStatusColorMap,
        purchaseRequestStatusColorMap,
      ];

      for (const map of mapsWithCancelled) {
        expect(['gray', 'red']).toContain(map.CANCELLED);
      }
    });
  });
});
