/**
 * Formatea un número como moneda USD
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Genera un ID de usuario aleatorio
 */
export const generateUserId = (): string => {
  return `user_${Math.floor(Math.random() * 100000)}`;
};

/**
 * Genera un ID de dispositivo aleatorio
 */
export const generateDeviceId = (): string => {
  const devices = ['mobile', 'tablet', 'desktop'];
  const randomDevice = devices[Math.floor(Math.random() * devices.length)];
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${randomDevice}_${randomId}`;
};
