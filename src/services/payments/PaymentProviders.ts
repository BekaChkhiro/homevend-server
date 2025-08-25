export enum PaymentProviderEnum {
  TEST = 'test',
  FLITT = 'flitt'
}

export interface PaymentProvider {
  id: PaymentProviderEnum;
  name: string;
  displayName: string;
  isEnabled: boolean;
  minAmount: number;
  maxAmount: number;
  currency: string;
  description?: string;
}

export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  {
    id: PaymentProviderEnum.TEST,
    name: 'test',
    displayName: 'ტესტი (დეველოპმენტისთვის)',
    isEnabled: process.env.NODE_ENV === 'development',
    minAmount: 0.01,
    maxAmount: 10000,
    currency: 'GEL',
    description: 'ტესტისთვის - მყისიერი შევსება'
  },
  {
    id: PaymentProviderEnum.FLITT,
    name: 'flitt',
    displayName: 'ბანკის ბარათი (Flitt)',
    isEnabled: true,
    minAmount: 1,
    maxAmount: 10000,
    currency: 'GEL',
    description: 'ონლაინ გადახდა ვიზა/მასტერკარდით'
  }
];

export const getEnabledPaymentProviders = (): PaymentProvider[] => {
  return PAYMENT_PROVIDERS.filter(provider => provider.isEnabled);
};

export const getPaymentProvider = (id: PaymentProviderEnum): PaymentProvider | undefined => {
  return PAYMENT_PROVIDERS.find(provider => provider.id === id);
};