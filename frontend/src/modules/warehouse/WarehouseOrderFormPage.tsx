import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { Combobox } from '@/design-system/components/Combobox';
import { DatePicker } from '@/design-system/components/DatePicker';
import { warehouseOrdersApi } from '@/api/warehouseOrders';
import {
  useWarehouseLocationOptions,
  usePartnerOptions,
  useContractOptions,
  useEmployeeOptions,
} from '@/hooks/useSelectOptions';
import { t } from '@/i18n';

const orderTypeOptions = [
  { value: 'RECEIPT', label: t('statusLabels.warehouseOrderType.RECEIPT') },
  { value: 'ISSUE', label: t('statusLabels.warehouseOrderType.ISSUE') },
  { value: 'INTERNAL_TRANSFER', label: t('statusLabels.warehouseOrderType.INTERNAL_TRANSFER') },
  { value: 'RETURN', label: t('statusLabels.warehouseOrderType.RETURN') },
];

const schema = z.object({
  orderNumber: z.string().min(1, t('warehouse.orders.validationNumberRequired')),
  orderType: z.string().min(1, t('warehouse.orders.validationTypeRequired')),
  orderDate: z.string().min(1, t('warehouse.orders.validationDateRequired')),
  warehouseId: z.string().min(1, t('warehouse.orders.validationWarehouseRequired')),
  counterpartyId: z.string().optional(),
  contractId: z.string().optional(),
  responsibleId: z.string().optional(),
  receiverId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const WarehouseOrderFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { options: locationOptions } = useWarehouseLocationOptions();
  const { options: partnerOptions } = usePartnerOptions();
  const { options: contractOptions } = useContractOptions();
  const { options: employeeOptions } = useEmployeeOptions('ACTIVE');

  const { data: existing } = useQuery({
    queryKey: ['warehouse-order', id],
    queryFn: () => warehouseOrdersApi.getOrder(id!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: isEdit && existing
      ? {
          orderNumber: existing.orderNumber,
          orderType: existing.orderType,
          orderDate: existing.orderDate,
          warehouseId: existing.warehouseId,
          counterpartyId: existing.counterpartyId ?? '',
          contractId: existing.contractId ?? '',
          responsibleId: existing.responsibleId ?? '',
          receiverId: existing.receiverId ?? '',
          notes: existing.notes ?? '',
        }
      : undefined,
    defaultValues: {
      orderNumber: '',
      orderType: '',
      orderDate: '',
      warehouseId: '',
      counterpartyId: '',
      contractId: '',
      responsibleId: '',
      receiverId: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      warehouseOrdersApi.createOrder({
        orderNumber: data.orderNumber,
        orderType: data.orderType,
        orderDate: data.orderDate,
        warehouseId: data.warehouseId,
        counterpartyId: data.counterpartyId || undefined,
        contractId: data.contractId || undefined,
        responsibleId: data.responsibleId || undefined,
        receiverId: data.receiverId || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-orders'] });
      toast.success(t('warehouse.orders.toastCreated'));
      navigate(`/warehouse/orders/${result.id}`);
    },
    onError: () => toast.error(t('warehouse.orders.toastError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      warehouseOrdersApi.updateOrder(id!, {
        orderDate: data.orderDate,
        warehouseId: data.warehouseId,
        counterpartyId: data.counterpartyId || undefined,
        contractId: data.contractId || undefined,
        responsibleId: data.responsibleId || undefined,
        receiverId: data.receiverId || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-order', id] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-orders'] });
      toast.success(t('warehouse.orders.toastUpdated'));
      navigate(`/warehouse/orders/${id}`);
    },
    onError: () => toast.error(t('warehouse.orders.toastError')),
  });

  const onSubmit = (data: FormData) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit
          ? t('warehouse.orders.formEditTitle', { number: existing?.orderNumber ?? '' })
          : t('warehouse.orders.formTitle')}
        subtitle={t('warehouse.orders.formSubtitle')}
        backTo={isEdit ? `/warehouse/orders/${id}` : '/warehouse/orders'}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.orders.breadcrumb'), href: '/warehouse/orders' },
          { label: isEdit ? existing?.orderNumber ?? '...' : t('common.create') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('warehouse.orders.formSectionMain')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('warehouse.orders.formLabelNumber')} error={errors.orderNumber?.message} required>
              <Input
                placeholder={t('warehouse.orders.formPlaceholderNumber')}
                hasError={!!errors.orderNumber}
                disabled={isEdit}
                {...register('orderNumber')}
              />
            </FormField>
            <FormField label={t('warehouse.orders.formLabelType')} error={errors.orderType?.message} required>
              <Select
                options={orderTypeOptions}
                placeholder={t('warehouse.orders.formLabelType')}
                hasError={!!errors.orderType}
                disabled={isEdit}
                {...register('orderType')}
              />
            </FormField>
            <FormField label={t('warehouse.orders.formLabelDate')} error={errors.orderDate?.message} required>
              <Controller
                name="orderDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.orderDate}
                  />
                )}
              />
            </FormField>
            <FormField label={t('warehouse.orders.formLabelWarehouse')} error={errors.warehouseId?.message} required>
              <Controller
                name="warehouseId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={locationOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('warehouse.orders.formLabelWarehouse')}
                    hasError={!!errors.warehouseId}
                  />
                )}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('warehouse.orders.formSectionDetails')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('warehouse.orders.formLabelCounterparty')}>
              <Controller
                name="counterpartyId"
                control={control}
                render={({ field }) => (
                  <Combobox options={partnerOptions} value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </FormField>
            <FormField label={t('warehouse.orders.formLabelContract')}>
              <Controller
                name="contractId"
                control={control}
                render={({ field }) => (
                  <Combobox options={contractOptions} value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </FormField>
            <FormField label={t('warehouse.orders.formLabelResponsible')}>
              <Controller
                name="responsibleId"
                control={control}
                render={({ field }) => (
                  <Combobox options={employeeOptions} value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </FormField>
            <FormField label={t('warehouse.orders.formLabelReceiver')}>
              <Controller
                name="receiverId"
                control={control}
                render={({ field }) => (
                  <Combobox options={employeeOptions} value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('warehouse.orders.formLabelNotes')}>
              <Textarea
                placeholder={t('warehouse.orders.formPlaceholderNotes')}
                rows={3}
                {...register('notes')}
              />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isPending}>
            {isEdit ? t('warehouse.orders.formUpdate') : t('warehouse.orders.formSave')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/warehouse/orders/${id}` : '/warehouse/orders')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WarehouseOrderFormPage;
