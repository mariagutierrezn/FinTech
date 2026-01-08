import React, { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { LocationInput } from './LocationInput';
import { generateDeviceId } from '@/utils/formatters';
import type { TransactionRequest } from '@/types/transaction';

interface TransactionFormProps {
  onSubmit: (transaction: TransactionRequest) => void;
  isLoading: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [formData, setFormData] = useState<TransactionRequest>({
    amount: 0,
    userId: 'user_demo', // Usuario fijo para pruebas (en producción vendría de sesión/auth)
    location: '', // Vacío para que el usuario ingrese o use GPS
    deviceId: generateDeviceId(),
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TransactionRequest, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TransactionRequest, string>> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (!formData.userId.trim()) {
      newErrors.userId = 'El ID de usuario es requerido';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La ubicación es requerida';
    }

    if (!formData.deviceId.trim()) {
      newErrors.deviceId = 'El ID del dispositivo es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof TransactionRequest) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'amount' ? parseFloat(e.target.value) || 0 : e.target.value,
    }));
    // Limpiar error al editar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Monto de la Transferencia"
        type="number"
        step="0.01"
        placeholder="0.00"
        value={formData.amount || ''}
        onChange={handleChange('amount')}
        error={errors.amount}
        disabled={isLoading}
      />

      <Input
        label="ID de Usuario"
        type="text"
        placeholder="user_12345"
        value={formData.userId}
        onChange={handleChange('userId')}
        error={errors.userId}
        disabled={isLoading}
      />

      <LocationInput
        value={formData.location}
        onChange={(value) => {
          setFormData(prev => ({ ...prev, location: value }));
          if (errors.location) {
            setErrors(prev => ({ ...prev, location: undefined }));
          }
        }}
        error={errors.location}
        disabled={isLoading}
      />

      <Input
        label="ID del Dispositivo"
        type="text"
        placeholder="mobile_ABC123"
        value={formData.deviceId}
        onChange={handleChange('deviceId')}
        error={errors.deviceId}
        disabled={isLoading}
      />

      <Button type="submit" isLoading={isLoading}>
        Realizar Transacción
      </Button>
    </form>
  );
};
