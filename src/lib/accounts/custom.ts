import { type CustomAccountDefinition } from '@/types/accounts';

export const MAX_CUSTOM_MAIN_ACCOUNTS = 10;

export const buildCustomAccountDefinition = (
  position: number,
  label: string,
  description: string = 'User-defined main allocation bucket.'
): CustomAccountDefinition => {
  if (position < 1 || position > MAX_CUSTOM_MAIN_ACCOUNTS) {
    throw new RangeError(`Custom account position must be between 1 and ${MAX_CUSTOM_MAIN_ACCOUNTS}.`);
  }

  return {
    type: 'custom',
    group: 'main',
    label,
    description,
    customPosition: position,
  };
};
