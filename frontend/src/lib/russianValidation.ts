/**
 * Russian document validators: INN, KPP, SNILS, OGRN, phone.
 * Checksum algorithms follow official FNS / PFR specifications.
 */

export function validateINN(inn: string): { valid: boolean; type?: 'individual' | 'legal'; error?: string } {
  const cleaned = inn.replace(/\s/g, '');

  if (!/^\d{10}$/.test(cleaned) && !/^\d{12}$/.test(cleaned)) {
    return { valid: false, error: 'ИНН должен содержать 10 или 12 цифр' };
  }

  const digits = cleaned.split('').map(Number);

  if (digits.length === 10) {
    const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    const sum = weights.reduce((acc, w, i) => acc + w * digits[i], 0);
    const check = (sum % 11) % 10;
    return {
      valid: check === digits[9],
      type: 'legal',
      error: check !== digits[9] ? 'Неверная контрольная сумма ИНН' : undefined,
    };
  }

  if (digits.length === 12) {
    const weights1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const sum1 = weights1.reduce((acc, w, i) => acc + w * digits[i], 0);
    const check1 = (sum1 % 11) % 10;

    const weights2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const sum2 = weights2.reduce((acc, w, i) => acc + w * digits[i], 0);
    const check2 = (sum2 % 11) % 10;

    const valid = check1 === digits[10] && check2 === digits[11];
    return {
      valid,
      type: 'individual',
      error: !valid ? 'Неверная контрольная сумма ИНН' : undefined,
    };
  }

  return { valid: false, error: 'Неверный формат ИНН' };
}

export function validateKPP(kpp: string): { valid: boolean; error?: string } {
  const cleaned = kpp.replace(/\s/g, '');
  if (!/^\d{4}[\dA-Z]{2}\d{3}$/.test(cleaned)) {
    return { valid: false, error: 'КПП должен содержать 9 символов (4 цифры + 2 символа + 3 цифры)' };
  }
  return { valid: true };
}

export function validateSNILS(snils: string): { valid: boolean; error?: string } {
  const cleaned = snils.replace(/[-\s]/g, '');

  if (!/^\d{11}$/.test(cleaned)) {
    return { valid: false, error: 'СНИЛС должен содержать 11 цифр' };
  }

  const digits = cleaned.split('').map(Number);
  const checkDigits = digits[9] * 10 + digits[10];

  const number = parseInt(cleaned.substring(0, 9));
  if (number <= 1001998) {
    return { valid: true }; // Old format, no checksum validation
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (9 - i);
  }

  let checksum: number;
  if (sum < 100) {
    checksum = sum;
  } else if (sum === 100 || sum === 101) {
    checksum = 0;
  } else {
    checksum = sum % 101;
    if (checksum === 100) checksum = 0;
  }

  return {
    valid: checksum === checkDigits,
    error: checksum !== checkDigits ? 'Неверная контрольная сумма СНИЛС' : undefined,
  };
}

export function validateOGRN(ogrn: string): { valid: boolean; error?: string } {
  const cleaned = ogrn.replace(/\s/g, '');

  if (!/^\d{13}$/.test(cleaned) && !/^\d{15}$/.test(cleaned)) {
    return { valid: false, error: 'ОГРН должен содержать 13 или 15 цифр' };
  }

  if (cleaned.length === 13) {
    const num = BigInt(cleaned.substring(0, 12));
    const check = Number(num % 11n) % 10;
    return {
      valid: check === Number(cleaned[12]),
      error: check !== Number(cleaned[12]) ? 'Неверная контрольная сумма ОГРН' : undefined,
    };
  }

  if (cleaned.length === 15) {
    const num = BigInt(cleaned.substring(0, 14));
    const check = Number(num % 13n) % 10;
    return {
      valid: check === Number(cleaned[14]),
      error: check !== Number(cleaned[14]) ? 'Неверная контрольная сумма ОГРНИП' : undefined,
    };
  }

  return { valid: false };
}

export function validateRussianPhone(phone: string): { valid: boolean; formatted?: string; error?: string } {
  const cleaned = phone.replace(/[\s()\-+]/g, '');

  if (/^[78]\d{10}$/.test(cleaned)) {
    const digits = cleaned.substring(1);
    return {
      valid: true,
      formatted: `+7 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6, 8)}-${digits.substring(8, 10)}`,
    };
  }
  if (/^\d{10}$/.test(cleaned)) {
    return {
      valid: true,
      formatted: `+7 (${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 10)}`,
    };
  }

  return { valid: false, error: 'Неверный формат телефона. Ожидается: +7 (XXX) XXX-XX-XX' };
}
