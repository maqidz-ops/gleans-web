// Only presentation data is stored here. DOKU must create and verify real payments on the server.
export const CHECKOUT_PREVIEW_KEY = "gleans:payment-preview:v1";
export type CheckoutSummary = { id: string; amount: number; document: string };
