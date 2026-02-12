import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://atlback-8yq4.vercel.app";

/**
 * ShipLink Types - Based on Bolesa API Documentation
 */

// Order Item
export interface ShipLinkOrderItem {
  id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  name: string;
  description?: string;
  weight: {
    value: number;
    unit: string;
  };
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

// Address
export interface ShipLinkAddress {
  country_code?: string;
  city?: string;
  city_id?: string | number;
  address_line?: string;
  postal_code?: string;
  district?: string;
  note?: string;
  latitude?: number;
  longitude?: number;
  short_address?: string; // Priority over address_line and city
}

// Shipment (Vendor/Shipper)
export interface ShipLinkShipment {
  vendor_id: number; // Required, must be unique per order, integer
  type?: "company" | "individual";
  name: string;
  phone: string;
  email?: string | null;
  total_items_price?: number;
  total_items_weight: number;
  shipping_type?: "regular" | "express" | "cold" | "heavy";
  carrier?: string; // Used when carrier_strategy is "specified"
  cod_amount?: number;
  items: ShipLinkOrderItem[];
  address: ShipLinkAddress;
}

// Consignee (Receiver)
export interface ShipLinkConsignee {
  name: string;
  phone: string;
  email?: string | null;
  address: ShipLinkAddress;
}

// Order
export interface ShipLinkOrder {
  id: string | number;
  status?: string;
  tracking_number?: string;
  payment_method: "cc" | "cod";
  shipment_direction: "shipment" | "return";
  carrier_strategy?: "lowest_price" | "shared" | "specified" | "";
  shipments: ShipLinkShipment[];
  consignee: ShipLinkConsignee;
}

// Match Carrier Response
export interface ShipLinkMatchedCarrierResponse {
  success: boolean;
  shipments: Array<{
    vendor_id: number;
    carrier: string;
    price: number;
  }>;
  processing_id: string;
  message?: string;
  error?: string;
}

// AWB Shipment
export interface ShipLinkAWBShipment {
  success: boolean;
  id: number;
  shipment_id: string;
  vendor_id: string;
  tracking_number: string;
  label: string;
  bill_link: string;
  public_link: string;
  status_code: string;
  payment_type: string;
  price: string;
  carrier: string;
  number_of_pieces: number;
  awb_reference: string;
  description: string;
  pickup: string;
  weight: string;
  shipping_types: string;
  pickup_id: string | null;
  shipment_direction: string;
  issue_fees: string;
  shipper_name: string;
  shipper_company_name: string;
  shipper_address_line_1: string;
  shipper_phone: string;
  shipper_country_code: string;
  shipper_city: string;
  shipper_city_id: number;
  consignee_name: string;
  consignee_company_name: string;
  consignee_address_line_1: string;
  consignee_city: string;
  consignee_city_id: number;
  consignee_email: string;
  consignee_country_code: string;
  consignee_phone: string;
  meta: {
    name: string;
    type: string;
    email: string | null;
    phone: string;
    vendor_id: number;
  };
  errors: string[];
  created_at: string;
  updated_at: string;
}

// Create AWB Response
export interface ShipLinkCreateAWBResponse {
  success: boolean;
  status: string;
  order_id: string;
  order_number: string;
  store_name: string;
  shipments: ShipLinkAWBShipment[];
  message?: string;
  error?: string;
}

// Tracking Status
export interface ShipLinkTrackingStatus {
  awb: string;
  time: string;
  code: string;
  status: string;
  description: string;
  ar_description?: string;
  location?: string;
  comment?: string;
}

// Track Response
export interface ShipLinkTrackResponse {
  success: boolean;
  order_id: number;
  order_number: string;
  result: Array<{
    success: boolean;
    vendor_id: string;
    tracking_number: string;
    carrier_name: string;
    local_status: string;
    trackingStatuses: ShipLinkTrackingStatus[];
    is_delivered: boolean;
  }>;
  message?: string;
  error?: string;
}

// Get All Orders Response
export interface ShipLinkGetAllOrdersResponse {
  success: boolean;
  result: Array<{
    status: string;
    order_id: string;
    order_number: string;
    store_name: string;
    shipments: ShipLinkAWBShipment[];
  }>;
  message?: string;
  error?: string;
}

/**
 * Extract error message from API response
 */
function extractErrorMessage(data: Record<string, unknown>): string {
  if (typeof data.error === "string") return data.error;
  if (typeof data.message === "string") return data.message;
  
  const errors = data.errors as Record<string, unknown> | undefined;
  if (errors) {
    if (Array.isArray(errors.message) && errors.message.length > 0) {
      return String(errors.message[0]);
    }
    if (typeof errors.message === "string") {
      return errors.message;
    }
    if (typeof errors === "string") {
      return errors;
    }
  }
  
  return "Unknown error occurred";
}

/**
 * Bolesa Carrier (for UI display)
 */
export interface BolesaCarrier {
  carrier_id: string | number;
  carrier_name: string;
  price: number;
  estimated_days?: number;
  service_type?: string;
  vendor_id?: number;
}

/**
 * ShipLink Hook
 * Provides methods to interact with ShipLink API
 */
export function useShipLink() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Get Matched Carrier for Shipments
   * POST /api/bolesa/shiplink/match-carrier
   */
  const getMatchedCarriers = useCallback(
    async (params: {
      order: ShipLinkOrder;
    }): Promise<ShipLinkMatchedCarrierResponse | null> => {
      setLoading(true);
      try {
        // Validate order structure
        if (!params.order) {
          throw new Error("Order object is required");
        }

        if (!params.order.shipments || params.order.shipments.length === 0) {
          throw new Error("Order must contain at least one shipment");
        }

        if (!params.order.consignee) {
          throw new Error("Order must contain consignee");
        }

        console.log("[useShipLink] Getting matched carriers:", {
          order_id: params.order.id,
          shipments_count: params.order.shipments.length,
          carrier_strategy: params.order.carrier_strategy,
        });

        const response = await fetch(
          `${BACKEND_URL}/api/bolesa/shiplink/match-carrier`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: params.order }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMessage = extractErrorMessage(data);
          console.error("[useShipLink] API error:", {
            status: response.status,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }

        console.log("[useShipLink] Matched carriers received:", {
          processing_id: data.processing_id,
          shipments_count: data.shipments?.length || 0,
        });

        return data;
      } catch (error: unknown) {
        const err = error as Error;
        console.error("[useShipLink] Error:", err.message);
        toast({
          title: "خطأ",
          description: err.message || "فشل في الحصول على شركات الشحن",
          variant: "destructive",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  /**
   * Create AWB through ShipLink
   * POST /api/bolesa/shiplink/create-awb/{store_uid}
   */
  const createAWB = useCallback(
    async (
      storeUid: string,
      params: {
        order?: ShipLinkOrder;
        processing_id?: string;
      }
    ): Promise<ShipLinkCreateAWBResponse | null> => {
      setLoading(true);
      try {
        if (!params.order && !params.processing_id) {
          throw new Error("Either 'order' or 'processing_id' must be provided");
        }

        console.log("[useShipLink] Creating AWB:", {
          store_uid: storeUid,
          has_order: !!params.order,
          has_processing_id: !!params.processing_id,
        });

        const response = await fetch(
          `${BACKEND_URL}/api/bolesa/shiplink/create-awb/${storeUid}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMessage = extractErrorMessage(data);
          throw new Error(errorMessage);
        }

        toast({
          title: "تم إنشاء الشحنة بنجاح",
          description: `تم إنشاء ${data.shipments?.length || 0} شحنة`,
        });

        return data;
      } catch (error: unknown) {
        const err = error as Error;
        console.error("[useShipLink] Error creating AWB:", err.message);
        toast({
          title: "خطأ",
          description: err.message || "فشل في إنشاء الشحنة",
          variant: "destructive",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  /**
   * Track Order Shipments
   * POST /api/bolesa/shiplink/track-shipments
   */
  const trackShipments = useCallback(
    async (
      orderId: string | number,
      trackingNumber: string
    ): Promise<ShipLinkTrackResponse | null> => {
      setLoading(true);
      try {
        console.log("[useShipLink] Tracking shipments:", {
          order_id: orderId,
          tracking_number: trackingNumber,
        });

        const response = await fetch(
          `${BACKEND_URL}/api/bolesa/shiplink/track-shipments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order: {
                id: orderId,
                tracking_number: trackingNumber,
              },
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMessage = extractErrorMessage(data);
          throw new Error(errorMessage);
        }

        return data;
      } catch (error: unknown) {
        const err = error as Error;
        console.error("[useShipLink] Error tracking:", err.message);
        toast({
          title: "خطأ",
          description: err.message || "فشل في تتبع الشحنة",
          variant: "destructive",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  /**
   * Get All Orders
   * GET /api/bolesa/shiplink/all-orders
   */
  const getAllOrders = useCallback(
    async (filters?: {
      vendor_id?: number;
      tracking_number?: string;
      order_id?: string;
      order_number?: string;
    }): Promise<ShipLinkGetAllOrdersResponse | null> => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters?.vendor_id) queryParams.append("vendor_id", filters.vendor_id.toString());
        if (filters?.tracking_number) queryParams.append("tracking_number", filters.tracking_number);
        if (filters?.order_id) queryParams.append("order_id", filters.order_id);
        if (filters?.order_number) queryParams.append("order_number", filters.order_number);

        const url = `${BACKEND_URL}/api/bolesa/shiplink/all-orders${
          queryParams.toString() ? `?${queryParams.toString()}` : ""
        }`;

        console.log("[useShipLink] Getting all orders:", filters);

        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMessage = extractErrorMessage(data);
          throw new Error(errorMessage);
        }

        return data;
      } catch (error: unknown) {
        const err = error as Error;
        console.error("[useShipLink] Error getting orders:", err.message);
        toast({
          title: "خطأ",
          description: err.message || "فشل في الحصول على الطلبات",
          variant: "destructive",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return {
    loading,
    getMatchedCarriers,
    createAWB,
    trackShipments,
    getAllOrders,
  };
}
