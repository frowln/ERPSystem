import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './index';

const meta: Meta<typeof FormField> = {
  title: 'Design System/FormField',
  component: FormField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Wrapper that wires up a label, hint, and error message to any form control via ' +
          'React.cloneElement. It automatically injects id, aria-describedby and aria-invalid ' +
          'onto the first child element.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

const inputCls =
  'w-full rounded-md border border-neutral-300 px-3 py-2 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-primary-500 ' +
  'aria-invalid:border-danger-500 aria-invalid:ring-danger-200';

const disabledCls =
  'w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 ' +
  'text-sm text-neutral-400 cursor-not-allowed';

/* ------------------------------------------------------------------ */
/* 1. Default                                                           */
/* ------------------------------------------------------------------ */
export const Default: Story = {
  name: 'Default',
  render: () => (
    <FormField label="Project name">
      <input type="text" placeholder="e.g. Nord Pipeline Phase 2" className={inputCls} />
    </FormField>
  ),
};

/* ------------------------------------------------------------------ */
/* 2. WithHint                                                          */
/* ------------------------------------------------------------------ */
export const WithHint: Story = {
  name: 'WithHint',
  render: () => (
    <FormField label="INN" hint="10-digit taxpayer identification number.">
      <input type="text" placeholder="1234567890" maxLength={10} className={inputCls} />
    </FormField>
  ),
};

/* ------------------------------------------------------------------ */
/* 3. WithError                                                         */
/* ------------------------------------------------------------------ */
export const WithError: Story = {
  name: 'WithError',
  render: () => (
    <FormField label="Contract number" error="Contract number already exists in the system.">
      <input
        type="text"
        defaultValue="CTR-2025-00001"
        className={inputCls}
      />
    </FormField>
  ),
};

/* ------------------------------------------------------------------ */
/* 4. WithLabel (no extra slot props — label-only baseline)            */
/* ------------------------------------------------------------------ */
export const WithLabel: Story = {
  name: 'WithLabel',
  render: () => (
    <FormField label="Counterparty">
      <select className={inputCls}>
        <option value="">— select —</option>
        <option value="1">Alpha Stroy LLC</option>
        <option value="2">Beta Montazh JSC</option>
        <option value="3">Gamma Servis Ltd</option>
      </select>
    </FormField>
  ),
};

/* ------------------------------------------------------------------ */
/* 5. Required                                                          */
/* ------------------------------------------------------------------ */
export const Required: Story = {
  name: 'Required',
  render: () => (
    <FormField label="Email" required hint="We will send notifications here.">
      <input type="email" placeholder="user@privod.ru" className={inputCls} />
    </FormField>
  ),
};

/* ------------------------------------------------------------------ */
/* 6. Disabled                                                          */
/* ------------------------------------------------------------------ */
export const Disabled: Story = {
  name: 'Disabled',
  render: () => (
    <FormField label="Created by">
      <input
        type="text"
        defaultValue="system@privod.ru"
        disabled
        className={disabledCls}
      />
    </FormField>
  ),
};

/* ------------------------------------------------------------------ */
/* 7. TextareaField                                                     */
/* ------------------------------------------------------------------ */
export const TextareaField: Story = {
  name: 'TextareaField',
  render: () => (
    <FormField
      label="Scope of work"
      hint="Describe the work scope in plain language. Max 2000 characters."
    >
      <textarea
        rows={5}
        placeholder="Installation and commissioning of pipeline valves DN500…"
        className={inputCls + ' resize-y'}
      />
    </FormField>
  ),
};
