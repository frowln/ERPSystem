import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './index';

const meta: Meta<typeof Modal> = {
  title: 'Design System/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Accessible dialog built with focus-trap, Escape-to-close, and overlay-click-to-close. ' +
          'Supports five sizes and an optional sticky footer slot.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'FULL'],
    },
    open: { control: 'boolean' },
    closeOnOverlayClick: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

/* ------------------------------------------------------------------ */
/* Controlled wrapper used by all interactive stories                  */
/* ------------------------------------------------------------------ */
function Controlled(props: Partial<React.ComponentProps<typeof Modal>>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        Open modal
      </button>
      <Modal open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Default                                                           */
/* ------------------------------------------------------------------ */
export const Default: Story = {
  name: 'Default (open)',
  render: () => (
    <Controlled
      title="Default Modal"
      description="This is the default medium-sized modal."
    >
      <p className="text-sm text-neutral-600">
        Modal body content goes here. You can place any React node inside.
      </p>
    </Controlled>
  ),
};

/* ------------------------------------------------------------------ */
/* 2. WithForm                                                          */
/* ------------------------------------------------------------------ */
export const WithForm: Story = {
  name: 'WithForm',
  render: () => (
    <Controlled
      title="Create Organisation"
      description="Fill in the details below to create a new organisation."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button className="rounded-md border border-neutral-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white">
            Save
          </button>
        </div>
      }
    >
      <form className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">Name</label>
          <input
            type="text"
            placeholder="Privod LLC"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">INN</label>
          <input
            type="text"
            placeholder="1234567890"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-neutral-700">Address</label>
          <textarea
            rows={3}
            placeholder="Moscow, Russia"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </form>
    </Controlled>
  ),
};

/* ------------------------------------------------------------------ */
/* 3. AlertDialog                                                       */
/* ------------------------------------------------------------------ */
export const AlertDialog: Story = {
  name: 'AlertDialog',
  render: () => (
    <Controlled
      title="Delete Contract"
      description="This action is permanent and cannot be undone."
      size="sm"
      closeOnOverlayClick={false}
      footer={
        <div className="flex justify-end gap-2">
          <button className="rounded-md border border-neutral-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button className="rounded-md bg-danger-600 px-4 py-2 text-sm text-white hover:bg-danger-700">
            Delete
          </button>
        </div>
      }
    >
      <p className="text-sm text-neutral-600">
        Are you sure you want to delete contract{'  '}
        <strong>CTR-2026-00142</strong>? All associated invoices and
        deliverables will also be removed.
      </p>
    </Controlled>
  ),
};

/* ------------------------------------------------------------------ */
/* 4. ScrollableContent                                                 */
/* ------------------------------------------------------------------ */
export const ScrollableContent: Story = {
  name: 'ScrollableContent',
  render: () => (
    <Controlled
      title="Terms & Conditions"
      size="md"
      footer={
        <div className="flex justify-end">
          <button className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white">
            I Agree
          </button>
        </div>
      }
    >
      <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <p key={i} className="text-sm text-neutral-600">
            {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Pellentesque habitant morbi tristique senectus et netus et malesuada
            fames ac turpis egestas. Proin pharetra nonummy pede.
          </p>
        ))}
      </div>
    </Controlled>
  ),
};

/* ------------------------------------------------------------------ */
/* 5. Nested                                                            */
/* ------------------------------------------------------------------ */
function NestedModals() {
  const [outer, setOuter] = useState(false);
  const [inner, setInner] = useState(false);
  return (
    <>
      <button
        onClick={() => setOuter(true)}
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white"
      >
        Open outer modal
      </button>

      <Modal
        open={outer}
        onClose={() => { setOuter(false); setInner(false); }}
        title="Outer Modal"
        size="lg"
        footer={
          <button
            onClick={() => setInner(true)}
            className="rounded-md bg-secondary-600 px-4 py-2 text-sm text-white"
          >
            Open inner modal
          </button>
        }
      >
        <p className="text-sm text-neutral-600">
          Click the button below to open a nested confirmation dialog.
        </p>

        <Modal
          open={inner}
          onClose={() => setInner(false)}
          title="Inner Confirmation"
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setInner(false)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { setInner(false); setOuter(false); }}
                className="rounded-md bg-primary-600 px-4 py-2 text-sm text-white"
              >
                Confirm
              </button>
            </div>
          }
        >
          <p className="text-sm text-neutral-600">
            Confirm the action started in the outer dialog.
          </p>
        </Modal>
      </Modal>
    </>
  );
}

export const Nested: Story = {
  name: 'Nested',
  render: () => <NestedModals />,
};
