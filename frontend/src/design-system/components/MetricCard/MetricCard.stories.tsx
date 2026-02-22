import type { Meta, StoryObj } from '@storybook/react';
import { MetricCard } from './index';
import { DollarSign, Users, Package, AlertTriangle } from 'lucide-react';

const meta: Meta<typeof MetricCard> = {
  title: 'Design System/MetricCard',
  component: MetricCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'KPI metric display card with optional trend indicator.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MetricCard>;

export const Default: Story = {
  args: {
    label: 'Total Revenue',
    value: '\u20bd 12.4M',
    icon: <DollarSign size={18} />,
  },
};

export const WithTrendUp: Story = {
  args: {
    label: 'Active Projects',
    value: 24,
    trend: {
      direction: 'up',
      value: '+12%',
    },
    icon: <Users size={18} />,
  },
};

export const WithTrendDown: Story = {
  args: {
    label: 'Open Issues',
    value: 8,
    trend: {
      direction: 'down',
      value: '-5%',
    },
    icon: <AlertTriangle size={18} />,
  },
};

export const Loading: Story = {
  args: {
    label: 'Materials in Stock',
    value: 0,
    icon: <Package size={18} />,
    loading: true,
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
      <MetricCard
        label="Revenue"
        value="\u20bd 12.4M"
        trend={{ direction: 'up', value: '+8%' }}
        icon={<DollarSign size={18} />}
      />
      <MetricCard
        label="Projects"
        value={24}
        trend={{ direction: 'up', value: '+3%' }}
        icon={<Users size={18} />}
      />
      <MetricCard
        label="Issues"
        value={12}
        trend={{ direction: 'down', value: '-2%' }}
        icon={<AlertTriangle size={18} />}
      />
      <MetricCard label="In Stock" value={1284} icon={<Package size={18} />} />
    </div>
  ),
  parameters: { layout: 'padded' },
};
