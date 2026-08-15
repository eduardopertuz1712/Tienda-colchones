export type ProductFormState = {
  error: string | null;
};

export const PRODUCT_FORM_INITIAL_STATE: ProductFormState = {
  error: null,
};

export type ProductFormAction = (
  prevState: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;
