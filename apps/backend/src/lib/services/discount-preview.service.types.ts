export type DiscountPreviewCategory = {
  count: number;
  subtotal: string;
  discountPercentage: number;
  discountAmount: string;
  totalAfterDiscount: string;
};

export type DiscountPreview = {
  services: DiscountPreviewCategory;
  products: DiscountPreviewCategory;
  totalBeforeDiscount: string;
  totalDiscountAmount: string;
  totalAfterDiscount: string;
};
