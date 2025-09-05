export enum PaymentProviderEnum {
  TEST = 'test',
  FLITT = 'flitt',
  BOG = 'bog'
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
    isEnabled: !!(process.env.FLITT_MERCHANT_ID && process.env.FLITT_SECRET_KEY),
    minAmount: 1,
    maxAmount: 10000,
    currency: 'GEL',
    description: 'ონლაინ გადახდა ვიზა/მასტერკარდით'
  },
  {
    id: PaymentProviderEnum.BOG,
    name: 'bog',
    displayName: 'საქართველოს ბანკი (BOG)',
    isEnabled: !!(process.env.BOG_CLIENT_ID && (process.env.BOG_SECRET_KEY || process.env.BOG_CLIENT_SECRET)),
    minAmount: 1,
    maxAmount: 50000,
    currency: 'GEL',
    description: 'ონლაინ გადახდა ბარათით, Apple Pay, Google Pay, განვადება'
  }
];

export const getEnabledPaymentProviders = (): PaymentProvider[] => {
  return PAYMENT_PROVIDERS.filter(provider => provider.isEnabled);
};

export const getPaymentProvider = (id: PaymentProviderEnum): PaymentProvider | undefined => {
  return PAYMENT_PROVIDERS.find(provider => provider.id === id);
};