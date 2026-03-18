import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getAllProducts, getProductById, getCartItems, addToCart, removeFromCart, clearCart, createOrder, getOrderById, getUserOrders, addOrderItem, updateOrderStatus, createCustomOrder, getUserCustomOrders, updateCustomOrderStatus } from "../db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

export const shopRouter = router({
  // ========== PRODUTOS ==========
  products: router({
    list: publicProcedure.query(async () => {
      return await getAllProducts();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getProductById(input.id);
      }),
  }),

  // ========== CARRINHO ==========
  cart: router({
    getItems: protectedProcedure.query(async ({ ctx }) => {
      return await getCartItems(ctx.user.id);
    }),

    addItem: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().int().positive().default(1),
        customizationNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await addToCart(
          ctx.user.id,
          input.productId,
          input.quantity,
          input.customizationNotes
        );
      }),

    removeItem: protectedProcedure
      .input(z.object({ cartItemId: z.number() }))
      .mutation(async ({ input }) => {
        await removeFromCart(input.cartItemId);
        return { success: true };
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ========== PEDIDOS ==========
  orders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserOrders(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await getOrderById(input.orderId);
      }),

    createCheckoutSession: protectedProcedure
      .input(z.object({
        cartItems: z.array(z.object({
          productId: z.number(),
          quantity: z.number().int().positive(),
          customizationNotes: z.string().optional(),
        })),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        shippingAddress: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Validar que todos os produtos existem e calcular total
          let totalAmount = 0;
          const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

          for (const item of input.cartItems) {
            const product = await getProductById(item.productId);
            if (!product) {
              throw new Error(`Produto ${item.productId} não encontrado`);
            }
            totalAmount += product.price * item.quantity;
            lineItems.push({
              price_data: {
                currency: "brl",
                product_data: {
                  name: product.name,
                  description: product.description || undefined,
                  images: product.image ? [product.image] : undefined,
                },
                unit_amount: product.price,
              },
              quantity: item.quantity,
            });
          }

          // Criar pedido no banco de dados
          const order = await createOrder(
            ctx.user.id,
            totalAmount,
            input.customerEmail || ctx.user.email || undefined,
            input.customerPhone,
            input.shippingAddress
          );

          // Adicionar itens ao pedido
          for (const item of input.cartItems) {
            const product = await getProductById(item.productId);
            if (product) {
              await addOrderItem(
                order.id,
                item.productId,
                item.quantity,
                product.price,
                item.customizationNotes
              );
            }
          }

          // Criar sessão de checkout no Stripe
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/orders/${order.id}?success=true`,
            cancel_url: `${process.env.VITE_FRONTEND_URL || "http://localhost:3000"}/cart?cancelled=true`,
            customer_email: input.customerEmail || ctx.user.email || undefined,
            client_reference_id: order.id.toString(),
            metadata: {
              orderId: order.id.toString(),
              userId: ctx.user.id.toString(),
            },
          });

          // Atualizar pedido com Stripe Payment Intent ID
          if (session.payment_intent) {
            await updateOrderStatus(order.id, "pending");
          }

          return {
            sessionUrl: session.url,
            orderId: order.id,
          };
        } catch (error) {
          console.error("[Checkout] Error creating session:", error);
          throw error;
        }
      }),
  }),



  // ========== PEDIDOS PERSONALIZADOS ==========
  customOrders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserCustomOrders(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createCustomOrder(
          ctx.user.id,
          input.title,
          input.description,
          input.imageUrl
        );
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        customOrderId: z.number(),
        status: z.enum(["draft", "submitted", "approved", "rejected", "completed"]),
        estimatedPrice: z.number().optional(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateCustomOrderStatus(
          input.customOrderId,
          input.status,
          input.estimatedPrice,
          input.adminNotes
        );
        return { success: true };
      }),
  }),
});
