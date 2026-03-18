import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, products, cartItems, orders, orderItems, customOrders, Product, CartItem, Order, OrderItem, CustomOrder } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== PRODUTOS ==========

export async function getAllProducts(): Promise<Product[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).where(eq(products.isActive, 1));
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ========== CARRINHO ==========

export async function getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  
  const itemsWithProducts = await Promise.all(
    items.map(async (item) => {
      const product = await getProductById(item.productId);
      return { ...item, product: product! };
    })
  );
  
  return itemsWithProducts.filter(item => item.product);
}

export async function addToCart(userId: number, productId: number, quantity: number = 1, customizationNotes?: string): Promise<CartItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(cartItems).where(
    and(eq(cartItems.userId, userId), eq(cartItems.productId, productId))
  ).limit(1);
  
  if (existing.length > 0) {
    await db.update(cartItems)
      .set({ quantity: existing[0].quantity + quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, existing[0].id));
    return { ...existing[0], quantity: existing[0].quantity + quantity };
  }
  
  const result = await db.insert(cartItems).values({
    userId,
    productId,
    quantity,
    customizationNotes,
  });
  
  return {
    id: (result[0] as unknown as { insertId: number }).insertId,
    userId,
    productId,
    quantity,
    customizationNotes: customizationNotes || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function removeFromCart(cartItemId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
}

export async function clearCart(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ========== PEDIDOS ==========

export async function createOrder(userId: number, totalAmount: number, customerEmail?: string, customerPhone?: string, shippingAddress?: string): Promise<Order> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(orders).values({
    userId,
    totalAmount,
    status: "pending",
    customerEmail: customerEmail || null,
    customerPhone: customerPhone || null,
    shippingAddress: shippingAddress || null,
  });
  
  return {
    id: (result[0] as unknown as { insertId: number }).insertId,
    userId,
    stripePaymentIntentId: null,
    totalAmount,
    status: "pending",
    customerEmail: customerEmail || null,
    customerPhone: customerPhone || null,
    shippingAddress: shippingAddress || null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getOrderById(orderId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (order.length === 0) return undefined;
  
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const itemsWithProducts = await Promise.all(
    items.map(async (item) => {
      const product = await getProductById(item.productId);
      return { ...item, product: product! };
    })
  );
  
  return { ...order[0], items: itemsWithProducts.filter(item => item.product) };
}

export async function getUserOrders(userId: number): Promise<Order[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.userId, userId));
}

export async function addOrderItem(orderId: number, productId: number, quantity: number, price: number, customizationNotes?: string): Promise<OrderItem> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(orderItems).values({
    orderId,
    productId,
    quantity,
    price,
    customizationNotes: customizationNotes || null,
  });
  
  return {
    id: (result[0] as unknown as { insertId: number }).insertId,
    orderId,
    productId,
    quantity,
    price,
    customizationNotes: customizationNotes || null,
    createdAt: new Date(),
  };
}

export async function updateOrderStatus(orderId: number, status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, orderId));
}

// ========== PEDIDOS PERSONALIZADOS ==========

export async function createCustomOrder(userId: number, title: string, description?: string, imageUrl?: string): Promise<CustomOrder> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(customOrders).values({
    userId,
    title,
    description: description || null,
    imageUrl: imageUrl || null,
    status: "draft",
  });
  
  return {
    id: (result[0] as unknown as { insertId: number }).insertId,
    userId,
    title,
    description: description || null,
    imageUrl: imageUrl || null,
    estimatedPrice: null,
    status: "draft",
    adminNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getUserCustomOrders(userId: number): Promise<CustomOrder[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(customOrders).where(eq(customOrders.userId, userId));
}

export async function updateCustomOrderStatus(customOrderId: number, status: "draft" | "submitted" | "approved" | "rejected" | "completed", estimatedPrice?: number, adminNotes?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: Record<string, unknown> = { status, updatedAt: new Date() };
  if (estimatedPrice !== undefined) updates.estimatedPrice = estimatedPrice;
  if (adminNotes !== undefined) updates.adminNotes = adminNotes;
  
  await db.update(customOrders).set(updates).where(eq(customOrders.id, customOrderId));
}
