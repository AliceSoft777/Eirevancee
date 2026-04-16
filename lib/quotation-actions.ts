"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Quotation } from "@/lib/supabase-types";
import { revalidatePath } from "next/cache";
import { getServerSession } from "./loaders";

// ──────────────────────────────────────────────────────────────
// Helper: returns an untyped Supabase query builder for tables
// not yet auto-generated in the Database type.
// This avoids TS2345 "never" errors when the generic can't
// resolve a table name through the createServerClient<Database> chain.
// ──────────────────────────────────────────────────────────────
async function getSupabase() {
  const supabase = await createServerSupabase();
  return supabase as any;
}

export async function getQuotations(filters?: { status?: string }) {
  const supabase = await getSupabase();
  let query = supabase
    .from("quotations")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Quotation[];
}

export async function getQuotationById(id: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as Quotation;
}

export async function searchProductsForQuote(searchQuery: string) {
  if (!searchQuery || searchQuery.length < 2) return [];

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, assigned_code, price, stock")
    .eq("status", "active")
    .or(`assigned_code.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`)
    .limit(15);

  if (error) throw new Error(error.message);
  return data;
}

export async function saveQuotation(
  quotationData: Record<string, unknown>,
  isNew: boolean = false,
) {
  const supabase = await getSupabase();
  const session = await getServerSession();

  if (
    !session.userId ||
    (session.userRole !== "admin" && session.userRole !== "sales")
  ) {
    throw new Error("Unauthorized to save quotes");
  }

  const finalData: Record<string, unknown> = { ...quotationData };

  if (isNew) {
    // Generate new quote number via DB function
    const { data: quoteNum, error: rpcError } = await supabase.rpc(
      "generate_quote_number",
    );
    if (rpcError)
      throw new Error(`Failed to generate quote number: ${rpcError.message}`);

    finalData.quote_number = quoteNum;
    finalData.created_by = session.userId;
  } else {
    // Cannot change creator or quote_number on update
    delete finalData.quote_number;
    delete finalData.created_by;
  }

  // Strip the GENERATED ALWAYS column — PG will reject it
  delete finalData.valid_until;

  let data: Record<string, unknown> | null = null;
  let error: { message: string } | null = null;

  if (isNew) {
    // INSERT — new row, DB generates the id
    const result = await supabase
      .from("quotations")
      .insert(finalData)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    // UPDATE — existing row by id
    const id = finalData.id;
    delete finalData.id;
    const result = await supabase
      .from("quotations")
      .update(finalData)
      .eq("id", id)
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) throw new Error(error.message);

  revalidatePath("/admin/quotations");
  if (!isNew && quotationData.id) {
    revalidatePath(`/admin/quotations/${quotationData.id}`);
  }
  return data as unknown as Quotation;
}

export async function deleteQuotation(id: string) {
  const supabase = await getSupabase();

  // Fetch quote number so we can clean up storage
  const { data: quote } = await supabase
    .from("quotations")
    .select("quote_number")
    .eq("id", id)
    .single();

  if (quote?.quote_number) {
    // fire-and-forget storage delete
    supabase.storage
      .from("uploads")
      .remove([`quotations/${quote.quote_number}/${quote.quote_number}.pdf`]);
  }

  const { error } = await supabase.from("quotations").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/quotations");
  return true;
}

export async function convertQuotationToOrder(quotationId: string) {
  const supabase = await getSupabase();
  const session = await getServerSession();

  if (!session.userId) {
    throw new Error("Unauthorized: user not authenticated");
  }

  // Get the quotation
  const { data: quote, error: quoteError } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", quotationId)
    .single();

  if (quoteError || !quote) {
    throw new Error("Quotation not found");
  }

  // Create order from quotation
  const orderData = {
    customer_name: quote.customer_name,
    customer_email: quote.customer_email,
    customer_phone: quote.customer_phone,
    customer_id: null,
    items: quote.items,
    subtotal: quote.subtotal,
    tax_rate: 23, // Default tax rate
    discount: 0,
    delivery_address:
      quote.delivery_collection === "Delivery"
        ? {
            line1: quote.delivery_address_line1,
            line2: quote.delivery_address_line2,
            city: quote.delivery_city,
            postcode: quote.delivery_postcode,
          }
        : null,
    status: "pending",
    notes: quote.instructions || "",
    created_by: session.userId,
  };

  // Generate order number via RPC
  const { data: orderNum, error: orderNumError } = await supabase.rpc(
    "generate_order_number",
  );
  if (orderNumError)
    throw new Error(
      `Failed to generate order number: ${orderNumError.message}`,
    );

  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      ...orderData,
      order_number: orderNum,
    })
    .select()
    .single();

  if (orderError) {
    throw new Error(`Failed to create order: ${orderError.message}`);
  }

  // Update quotation status to "converted"
  await supabase
    .from("quotations")
    .update({ status: "accepted" })
    .eq("id", quotationId);

  revalidatePath("/admin/quotations");
  revalidatePath("/admin/orders");

  return newOrder;
}

export async function recordQuotationChange(
  quotationId: string,
  changes: Record<string, unknown>,
) {
  const supabase = await getSupabase();
  const session = await getServerSession();

  if (!session.userId) {
    throw new Error("Unauthorized: user not authenticated");
  }

  // Get current quotation history
  const { data: quote, error: fetchError } = await supabase
    .from("quotations")
    .select("history")
    .eq("id", quotationId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch quotation: ${fetchError.message}`);
  }

  // Build new history entry
  const existingHistory = Array.isArray(quote?.history) ? quote.history : [];
  const newHistoryEntry = {
    updated_at: new Date().toISOString(),
    updated_by: session.userId,
    username: session.user?.email || "Unknown",
    changes,
  };

  const updatedHistory = [...existingHistory, newHistoryEntry];

  // Update quotation with new history
  const { error: updateError } = await supabase
    .from("quotations")
    .update({ history: updatedHistory })
    .eq("id", quotationId);

  if (updateError) {
    throw new Error(`Failed to record change: ${updateError.message}`);
  }

  revalidatePath(`/admin/quotations/${quotationId}`);
  return true;
}

export async function getStoreVatRate(): Promise<number> {
  const supabase = await getSupabase();
  const { data } = await supabase
    .from("site_settings")
    .select("tax_rate")
    .eq("id", 1)
    .single();
  return (data?.tax_rate as number) || 23;
}

export async function updateQuotationPdfUrl(id: string, pdfUrl: string) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("quotations")
    .update({ pdf_url: pdfUrl })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/quotations");
  revalidatePath(`/admin/quotations/${id}`);
  return true;
}
