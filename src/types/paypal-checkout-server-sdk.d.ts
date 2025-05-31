declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    export namespace lib {
      class PayPalEnvironment {
        constructor(
          clientId: string,
          clientSecret: string,
          merchantId?: string,
          environment?: 'sandbox' | 'live' | string
        );
      }

      class PayPalHttpClient {
        constructor(environment: PayPalEnvironment);
      }

      class OAuthAuthorizationController {
        constructor(client: PayPalHttpClient);
        requestToken(auth: { authorization: string }, options: any): Promise<{ result: { accessToken: string } }>;
      }
    }
  }

  export namespace orders {
    export namespace lib {
      class OrdersController {
        constructor(client: any);
        // Add other methods as needed
      }
    }
  }

  export namespace payments {
    export namespace lib {
      // Add payment related types if needed
    }
  }

  // Re-export the main classes for easier access
  export const core: {
    PayPalEnvironment: typeof core.lib.PayPalEnvironment;
    PayPalHttpClient: typeof core.lib.PayPalHttpClient;
    OAuthAuthorizationController: typeof core.lib.OAuthAuthorizationController;
  };

  export const orders: {
    OrdersController: typeof orders.lib.OrdersController;
  };
}
