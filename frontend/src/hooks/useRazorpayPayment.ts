import { useState, useCallback } from "react";
import {
  usePurchasePlanMutation,
  usePurchaseTicketsMutation,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} from "@/store/api";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: RazorpayCheckout;
  }
}

interface RazorpayCheckout {
  new (options: RazorpayOptions): RazorpayInstance;
}

interface RazorpayInstance {
  open(): void;
  close(): void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface UseRazorpayPaymentProps {
  razorpayKey: string;
  onSuccess?: () => void;
}

export const useRazorpayPayment = ({
  razorpayKey,
  onSuccess,
}: UseRazorpayPaymentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [purchasePlan] = usePurchasePlanMutation();
  const [purchaseTickets] = usePurchaseTicketsMutation();
  const [createOrder] = useCreateRazorpayOrderMutation();
  const [verifyPayment] = useVerifyRazorpayPaymentMutation();

  const loadRazorpayScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay script"));
      document.head.appendChild(script);
    });
  }, []);

  const createRazorpayOrder = useCallback(
    async (params: {
      amount: number;
      currency: string;
      receipt: string;
      notes?: Record<string, unknown>;
    }): Promise<string> => {
      const result = await createOrder({
        amount: params.amount,
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes,
      }).unwrap();

      return result.data.id;
    },
    [createOrder]
  );

  const verifyRazorpayPayment = useCallback(
    async (response: RazorpayResponse): Promise<boolean> => {
      try {
        const result = await verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }).unwrap();

        return result.data.verified;
      } catch {
        return false;
      }
    },
    [verifyPayment]
  );

  const handlePlanPurchase = useCallback(
    async (
      planId: number,
      planName: string,
      planPrice: number,
      currency: string = "INR",
      customerInfo?: { name?: string; email?: string; phone?: string }
    ) => {
      setIsLoading(true);

      try {
        await loadRazorpayScript();

        const orderId = await createRazorpayOrder({
          amount: planPrice * 100, // Convert to paise
          currency,
          receipt: `plan_${planId}_${Date.now()}`,
          notes: {
            plan_id: planId,
            plan_name: planName,
            purchase_type: "plan",
          },
        });

        const options: RazorpayOptions = {
          key: razorpayKey,
          amount: planPrice * 100,
          currency,
          name: "Rekard",
          description: `Purchase of ${planName} plan`,
          order_id: orderId,
          prefill: {
            name: customerInfo?.name,
            email: customerInfo?.email,
            contact: customerInfo?.phone,
          },
          notes: {
            plan_id: planId.toString(),
            plan_name: planName,
            purchase_type: "plan",
          },
          theme: {
            color: "#3B82F6",
          },
          handler: async (response: RazorpayResponse) => {
            try {
              const verified = await verifyRazorpayPayment(response);
              if (verified) {
                await purchasePlan({
                  planId,
                  body: {
                    plan_id: planId,
                    payment_method_id: "razorpay",
                    external_payment_id: response.razorpay_payment_id,
                    billing_address: {},
                  },
                }).unwrap();

                toast({
                  title: "Success!",
                  description: `${planName} plan purchased successfully!`,
                });
                onSuccess?.();
              } else {
                toast({
                  title: "Payment Failed",
                  description: "Payment verification failed. Please contact support.",
                  variant: "destructive",
                });
              }
            } catch {
              toast({
                title: "Error",
                description: "Failed to process payment. Please try again.",
                variant: "destructive",
              });
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              toast({
                title: "Payment Cancelled",
                description: "You can try again anytime.",
              });
              setIsLoading(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch {
        toast({
          title: "Error",
          description: "Failed to initiate payment. Please check your connection.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    },
    [
      razorpayKey,
      loadRazorpayScript,
      createRazorpayOrder,
      verifyRazorpayPayment,
      purchasePlan,
      toast,
      onSuccess,
    ]
  );

  const handleTicketPurchase = useCallback(
    async (
      quantity: number,
      unitPrice: number,
      currency: string = "INR",
      customerInfo?: { name?: string; email?: string; phone?: string }
    ) => {
      setIsLoading(true);

      try {
        await loadRazorpayScript();

        const totalAmount = quantity * unitPrice;
        const orderId = await createRazorpayOrder({
          amount: totalAmount * 100, // Convert to paise
          currency,
          receipt: `tickets_${quantity}_${Date.now()}`,
          notes: {
            quantity,
            unit_price: unitPrice,
            purchase_type: "tickets",
          },
        });

        const options: RazorpayOptions = {
          key: razorpayKey,
          amount: totalAmount * 100,
          currency,
          name: "Rekard",
          description: `Purchase of ${quantity} tickets`,
          order_id: orderId,
          prefill: {
            name: customerInfo?.name,
            email: customerInfo?.email,
            contact: customerInfo?.phone,
          },
          notes: {
            quantity: quantity.toString(),
            unit_price: unitPrice.toString(),
            purchase_type: "tickets",
          },
          theme: {
            color: "#3B82F6",
          },
          handler: async (response: RazorpayResponse) => {
            try {
              const verified = await verifyRazorpayPayment(response);
              if (verified) {
                await purchaseTickets({
                  quantity,
                  currency,
                  payment_method_id: "razorpay",
                  external_payment_id: response.razorpay_payment_id,
                  billing_address: {},
                }).unwrap();

                toast({
                  title: "Success!",
                  description: `${quantity} tickets purchased successfully!`,
                });
                onSuccess?.();
              } else {
                toast({
                  title: "Payment Failed",
                  description: "Payment verification failed. Please contact support.",
                  variant: "destructive",
                });
              }
            } catch {
              toast({
                title: "Error",
                description: "Failed to process payment. Please try again.",
                variant: "destructive",
              });
            } finally {
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              toast({
                title: "Payment Cancelled",
                description: "You can try again anytime.",
              });
              setIsLoading(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch {
        toast({
          title: "Error",
          description: "Failed to initiate payment. Please check your connection.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    },
    [
      razorpayKey,
      loadRazorpayScript,
      createRazorpayOrder,
      verifyRazorpayPayment,
      purchaseTickets,
      toast,
      onSuccess,
    ]
  );

  return {
    handlePlanPurchase,
    handleTicketPurchase,
    isLoading,
  };
};

