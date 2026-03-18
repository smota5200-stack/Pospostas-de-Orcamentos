import { describe, it, expect, vi, beforeEach } from "vitest";
import { shopRouter } from "./shop";
import * as db from "../db";

// Mock do módulo db
vi.mock("../db", () => ({
  getAllProducts: vi.fn(),
  getProductById: vi.fn(),
  getCartItems: vi.fn(),
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
  createOrder: vi.fn(),
  getOrderById: vi.fn(),
  getUserOrders: vi.fn(),
  addOrderItem: vi.fn(),
  updateOrderStatus: vi.fn(),
  createCustomOrder: vi.fn(),
  getUserCustomOrders: vi.fn(),
  updateCustomOrderStatus: vi.fn(),
}));

// Mock do Stripe
vi.mock("stripe", () => ({
  default: vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  })),
}));

describe("Shop Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Products", () => {
    it("should list all products", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Painel Redondo 1.5m",
          description: "Test product",
          price: 7990,
          category: "aniversario",
          size: "1.5m",
          image: "/test.png",
          badge: "Popular",
          isActive: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getAllProducts).mockResolvedValue(mockProducts);

      const caller = shopRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.products.list();
      expect(result).toEqual(mockProducts);
      expect(db.getAllProducts).toHaveBeenCalled();
    });

    it("should get product by id", async () => {
      const mockProduct = {
        id: 1,
        name: "Painel Redondo 1.5m",
        description: "Test product",
        price: 7990,
        category: "aniversario",
        size: "1.5m",
        image: "/test.png",
        badge: "Popular",
        isActive: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getProductById).mockResolvedValue(mockProduct);

      const caller = shopRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.products.getById({ id: 1 });
      expect(result).toEqual(mockProduct);
      expect(db.getProductById).toHaveBeenCalledWith(1);
    });
  });

  describe("Cart", () => {
    const mockUser = {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    it("should get cart items for authenticated user", async () => {
      const mockCartItems = [
        {
          id: 1,
          userId: 1,
          productId: 1,
          quantity: 2,
          customizationNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          product: {
            id: 1,
            name: "Painel Redondo 1.5m",
            description: "Test product",
            price: 7990,
            category: "aniversario",
            size: "1.5m",
            image: "/test.png",
            badge: "Popular",
            isActive: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      vi.mocked(db.getCartItems).mockResolvedValue(mockCartItems);

      const caller = shopRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.cart.getItems();
      expect(result).toEqual(mockCartItems);
      expect(db.getCartItems).toHaveBeenCalledWith(1);
    });

    it("should add item to cart", async () => {
      const mockCartItem = {
        id: 1,
        userId: 1,
        productId: 1,
        quantity: 1,
        customizationNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.addToCart).mockResolvedValue(mockCartItem);

      const caller = shopRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.cart.addItem({
        productId: 1,
        quantity: 1,
      });

      expect(result).toEqual(mockCartItem);
      expect(db.addToCart).toHaveBeenCalledWith(1, 1, 1, undefined);
    });

    it("should remove item from cart", async () => {
      vi.mocked(db.removeFromCart).mockResolvedValue(undefined);

      const caller = shopRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.cart.removeItem({ cartItemId: 1 });
      expect(result).toEqual({ success: true });
      expect(db.removeFromCart).toHaveBeenCalledWith(1);
    });

    it("should clear cart", async () => {
      vi.mocked(db.clearCart).mockResolvedValue(undefined);

      const caller = shopRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.cart.clear();
      expect(result).toEqual({ success: true });
      expect(db.clearCart).toHaveBeenCalledWith(1);
    });
  });

  describe("Orders", () => {
    const mockUser = {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    it("should list user orders", async () => {
      const mockOrders = [
        {
          id: 1,
          userId: 1,
          stripePaymentIntentId: null,
          totalAmount: 7990,
          status: "pending" as const,
          customerEmail: "test@example.com",
          customerPhone: null,
          shippingAddress: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getUserOrders).mockResolvedValue(mockOrders);

      const caller = shopRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.orders.list();
      expect(result).toEqual(mockOrders);
      expect(db.getUserOrders).toHaveBeenCalledWith(1);
    });
  });

  describe("Custom Orders", () => {
    const mockUser = {
      id: 1,
      openId: "test-user",
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    it("should list user custom orders", async () => {
      const mockCustomOrders = [
        {
          id: 1,
          userId: 1,
          title: "Custom Painel",
          description: "My custom design",
          imageUrl: null,
          estimatedPrice: null,
          status: "draft" as const,
          adminNotes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getUserCustomOrders).mockResolvedValue(mockCustomOrders);

      const caller = shopRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.customOrders.list();
      expect(result).toEqual(mockCustomOrders);
      expect(db.getUserCustomOrders).toHaveBeenCalledWith(1);
    });

    it("should create custom order", async () => {
      const mockCustomOrder = {
        id: 1,
        userId: 1,
        title: "Custom Painel",
        description: "My custom design",
        imageUrl: null,
        estimatedPrice: null,
        status: "draft" as const,
        adminNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.createCustomOrder).mockResolvedValue(mockCustomOrder);

      const caller = shopRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.customOrders.create({
        title: "Custom Painel",
        description: "My custom design",
      });

      expect(result).toEqual(mockCustomOrder);
      expect(db.createCustomOrder).toHaveBeenCalledWith(1, "Custom Painel", "My custom design", undefined);
    });
  });
});
