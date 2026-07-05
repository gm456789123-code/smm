export interface Service {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill: boolean;
  cancel: boolean;
  provider: string;
}

export interface OrderStatus {
  charge: string;
  start_count: string;
  status: string;
  remains: string;
  currency: string;
}

export interface RefillStatus {
  status: string;
}

export interface BalanceResponse {
  balance: string;
  currency: string;
}

export interface AddOrderParams {
  service: string;
  link: string;
  quantity: string;
  runs?: string;
  interval?: string;
}

function createSmmApi(apiUrl: string, apiKey: string, provider: string) {
  async function call(params: Record<string, string>): Promise<unknown> {
    const body = new URLSearchParams({ key: apiKey, ...params });
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  return {
    provider,

    async services(): Promise<Service[]> {
      const data = await call({ action: 'services' }) as Service[];
      return data.map(s => ({ ...s, provider }));
    },

    addOrder(params: AddOrderParams): Promise<{ order: number }> {
      return call({ action: 'add', ...params }) as Promise<{ order: number }>;
    },

    orderStatus(orderId: string): Promise<OrderStatus> {
      return call({ action: 'status', order: orderId }) as Promise<OrderStatus>;
    },

    multiOrderStatus(orderIds: string[]): Promise<Record<string, OrderStatus | { error: string }>> {
      return call({ action: 'status', orders: orderIds.join(',') }) as Promise<
        Record<string, OrderStatus | { error: string }>
      >;
    },

    createRefill(orderId: string): Promise<{ refill: string }> {
      return call({ action: 'refill', order: orderId }) as Promise<{ refill: string }>;
    },

    createMultiRefill(orderIds: string[]): Promise<Array<{ order: number; refill: number | { error: string } }>> {
      return call({ action: 'refill', orders: orderIds.join(',') }) as Promise<
        Array<{ order: number; refill: number | { error: string } }>
      >;
    },

    refillStatus(refillId: string): Promise<RefillStatus> {
      return call({ action: 'refill_status', refill: refillId }) as Promise<RefillStatus>;
    },

    multiRefillStatus(refillIds: string[]): Promise<Array<{ refill: number; status: string | { error: string } }>> {
      return call({ action: 'refill_status', refills: refillIds.join(',') }) as Promise<
        Array<{ refill: number; status: string | { error: string } }>
      >;
    },

    cancelOrders(orderIds: string[]): Promise<Array<{ order: number; cancel: number | { error: string } }>> {
      return call({ action: 'cancel', orders: orderIds.join(',') }) as Promise<
        Array<{ order: number; cancel: number | { error: string } }>
      >;
    },

    balance(): Promise<BalanceResponse> {
      return call({ action: 'balance' }) as Promise<BalanceResponse>;
    },
  };
}

export const smmApi = createSmmApi(
  'https://24social.in.th/api/v2',
  process.env.SMM_API_KEY ?? '',
  '24social'
);

export const kmApi = createSmmApi(
  'https://km-social.com/api/v2',
  process.env.SMM_API_KEY_2 ?? '',
  'km-social'
);

export function getProviderApi(provider: string) {
  return provider === 'km-social' ? kmApi : smmApi;
}
