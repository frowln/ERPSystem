// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { getDemoModeBlockedMessage, DEMO_MODE_BLOCKED_ERROR_CODE } from './demoMode';

describe('demoMode', () => {
  it('DEMO_MODE_BLOCKED_ERROR_CODE is a constant string', () => {
    expect(DEMO_MODE_BLOCKED_ERROR_CODE).toBe('ERR_DEMO_MODE_WRITE_BLOCKED');
  });

  it('getDemoModeBlockedMessage returns message with default action', () => {
    const msg = getDemoModeBlockedMessage();
    expect(msg).toContain('Изменение данных');
    expect(msg).toContain('DEMO DATA');
  });

  it('getDemoModeBlockedMessage returns message with custom action', () => {
    const msg = getDemoModeBlockedMessage('Удаление');
    expect(msg).toContain('Удаление');
    expect(msg).toContain('DEMO DATA');
  });
});
