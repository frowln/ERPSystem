// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  validateINN,
  validateKPP,
  validateSNILS,
  validateOGRN,
  validateRussianPhone,
} from './russianValidation';

/* ------------------------------------------------------------------ */
/*  INN                                                               */
/* ------------------------------------------------------------------ */
describe('validateINN', () => {
  it('validates correct 10-digit legal entity INN', () => {
    const r = validateINN('7707083893'); // Sberbank
    expect(r.valid).toBe(true);
    expect(r.type).toBe('legal');
  });

  it('validates correct 12-digit individual INN', () => {
    const r = validateINN('500100732259');
    expect(r.valid).toBe(true);
    expect(r.type).toBe('individual');
  });

  it('rejects wrong checksum (10 digits)', () => {
    const r = validateINN('7707083890');
    expect(r.valid).toBe(false);
    expect(r.error).toBeDefined();
  });

  it('rejects wrong checksum (12 digits)', () => {
    const r = validateINN('500100732250');
    expect(r.valid).toBe(false);
    expect(r.error).toBeDefined();
  });

  it('rejects wrong length', () => {
    expect(validateINN('12345').valid).toBe(false);
  });

  it('rejects non-numeric', () => {
    expect(validateINN('770708389A').valid).toBe(false);
  });

  it('strips spaces before validation', () => {
    expect(validateINN('7707 083893').valid).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/*  KPP                                                               */
/* ------------------------------------------------------------------ */
describe('validateKPP', () => {
  it('accepts valid 9-digit KPP', () => {
    expect(validateKPP('770701001').valid).toBe(true);
  });

  it('accepts KPP with letters in positions 5-6', () => {
    expect(validateKPP('7707AZ001').valid).toBe(true);
  });

  it('rejects too short', () => {
    expect(validateKPP('77070').valid).toBe(false);
  });

  it('rejects lowercase letters', () => {
    expect(validateKPP('7707az001').valid).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  SNILS                                                             */
/* ------------------------------------------------------------------ */
describe('validateSNILS', () => {
  it('validates correct SNILS with dashes', () => {
    expect(validateSNILS('112-233-445 95').valid).toBe(true);
  });

  it('validates correct SNILS as plain digits', () => {
    expect(validateSNILS('11223344595').valid).toBe(true);
  });

  it('rejects invalid checksum', () => {
    const r = validateSNILS('112-233-445 00');
    expect(r.valid).toBe(false);
    expect(r.error).toBeDefined();
  });

  it('accepts old-format numbers (<= 001001998)', () => {
    expect(validateSNILS('00100199800').valid).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(validateSNILS('1234567890').valid).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  OGRN                                                              */
/* ------------------------------------------------------------------ */
describe('validateOGRN', () => {
  it('validates correct 13-digit OGRN', () => {
    expect(validateOGRN('1027700132195').valid).toBe(true); // Sberbank
  });

  it('rejects invalid 13-digit OGRN', () => {
    expect(validateOGRN('1027700132190').valid).toBe(false);
  });

  it('validates correct 15-digit OGRNIP', () => {
    expect(validateOGRN('304500116000157').valid).toBe(true);
  });

  it('rejects invalid 15-digit OGRNIP', () => {
    expect(validateOGRN('304500116000150').valid).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(validateOGRN('12345678').valid).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Phone                                                             */
/* ------------------------------------------------------------------ */
describe('validateRussianPhone', () => {
  it('formats 11-digit phone starting with 8', () => {
    const r = validateRussianPhone('89161234567');
    expect(r.valid).toBe(true);
    expect(r.formatted).toBe('+7 (916) 123-45-67');
  });

  it('formats 11-digit phone starting with 7', () => {
    const r = validateRussianPhone('79161234567');
    expect(r.valid).toBe(true);
    expect(r.formatted).toBe('+7 (916) 123-45-67');
  });

  it('formats 10-digit phone without country code', () => {
    const r = validateRussianPhone('9161234567');
    expect(r.valid).toBe(true);
    expect(r.formatted).toBe('+7 (916) 123-45-67');
  });

  it('handles +7 prefix with formatting', () => {
    const r = validateRussianPhone('+7 (916) 123-45-67');
    expect(r.valid).toBe(true);
    expect(r.formatted).toBe('+7 (916) 123-45-67');
  });

  it('rejects too short number', () => {
    expect(validateRussianPhone('12345').valid).toBe(false);
    expect(validateRussianPhone('12345').error).toBeDefined();
  });
});
