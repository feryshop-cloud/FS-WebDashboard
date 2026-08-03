import { z } from "zod";

export const LoginSchema = z.object({
  email: z
    .string({ message: "Email is required." })
    .email({ message: "Please enter a valid email address." }),
  password: z
    .string({ message: "Password is required." })
    .min(6, { message: "Password must be at least 6 characters long." }),
});

export const InventoryFormSchema = z.object({
  game_id: z
    .string({ message: "Game category is required." })
    .uuid({ message: "Invalid Game category selected." }),

  title_reference: z
    .string({ message: "Internal reference code is required." })
    .min(3, { message: "Reference code must be at least 3 characters." }),

  account_specs: z
    .string({ message: "Account specifications are required." })
    .min(10, { message: "Please provide more detailed account specifications." }),

  capital_price: z.coerce
    .number({
      message: "Capital price must be a valid number.",
    })
    .positive({ message: "Capital price must be greater than zero." }),

  asking_price: z.coerce
    .number({
      message: "Asking price must be a valid number.",
    })
    .positive({ message: "Asking price must be greater than zero." }),

  screenshot_url: z
    .string({ message: "Screenshot upload is required." })
    .url({ message: "Invalid image URL." })
    .optional(),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
export type InventoryFormData = z.infer<typeof InventoryFormSchema>;
