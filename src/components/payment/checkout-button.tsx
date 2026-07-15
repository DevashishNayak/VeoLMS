"use client";

import { useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, cb: (r: { error: { description: string } }) => void) => void;
    };
  }
}

interface CheckoutButtonProps {
  courseId: string;
  courseTitle: string;
  priceInPaise: number;
  userName?: string;
  userEmail?: string;
  /** Defaults to “Buy for ₹…” / “Enroll for Free”. */
  label?: string;
}

export function CheckoutButton({
  courseId,
  courseTitle,
  priceInPaise,
  userName,
  userEmail,
  label,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");

      if (priceInPaise === 0) {
        window.location.href = `/dashboard?enrolled=${courseId}`;
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "VeoLMS",
        description: courseTitle,
        order_id: data.orderId,
        prefill: { name: userName, email: userEmail },
        theme: { color: "#7c3aed" },
        handler: async (response) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              courseId,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setError(verifyData.error ?? "Payment verification failed");
            return;
          }
          window.location.href = `/dashboard?enrolled=${courseId}`;
        },
      });
      rzp.on("payment.failed", (r) => {
        setError(r.error.description);
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Button
        size="lg"
        className="w-full"
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading
          ? "Processing..."
          : label ??
            (priceInPaise === 0
              ? "Enroll for Free"
              : `Buy for ${formatPrice(priceInPaise)}`)}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </>
  );
}
