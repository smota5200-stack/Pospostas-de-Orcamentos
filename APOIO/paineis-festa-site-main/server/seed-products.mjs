import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

async function seedProducts() {
  if (!DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    // Check if products already exist
    const result = await connection.query("SELECT COUNT(*) as count FROM products");
    if (result[0][0].count > 0) {
      console.log("Products already exist, skipping seed");
      process.exit(0);
    }

    const productsToInsert = [
      {
        name: "Painel Redondo 1.5m",
        description: "Sistema Veste Fácil com elástico - Perfeito para aniversários",
        price: 7990,
        category: "aniversario",
        size: "1.5m",
        image: "/images/hero-painel-redondo.png",
        badge: "Mais Popular",
        isActive: 1,
      },
      {
        name: "Trio de Capas Cilindro",
        description: "Tamanhos P, M, G com acabamento premium",
        price: 9990,
        category: "festa",
        size: "P,M,G",
        image: "/images/trio-cilindros.png",
        isActive: 1,
      },
      {
        name: "Kit Painel + Trio",
        description: "Economize 12% comprando o kit completo",
        price: 14990,
        category: "festa",
        size: "1.5m",
        image: "/images/kit-promocional.png",
        badge: "SAVE 15%",
        isActive: 1,
      },
      {
        name: "Painel Retangular 3x2m",
        description: "Perfeito para fotos e decoração de eventos",
        price: 18990,
        category: "corporativo",
        size: "3x2m",
        image: "/images/backdrop-retangular.png",
        isActive: 1,
      },
      {
        name: "Painel Infantil Unicórnio",
        description: "Design colorido com tema unicórnio para crianças",
        price: 8990,
        category: "infantil",
        size: "1.5m",
        isActive: 1,
      },
      {
        name: "Painel Casamento Elegante",
        description: "Design sofisticado para cerimônias e recepções",
        price: 19990,
        category: "casamento",
        size: "3x2m",
        isActive: 1,
      },
    ];

    for (const product of productsToInsert) {
      await connection.query(
        "INSERT INTO products (name, description, price, category, size, image, badge, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [product.name, product.description, product.price, product.category, product.size, product.image, product.badge || null, product.isActive]
      );
    }

    console.log("Products seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedProducts();
