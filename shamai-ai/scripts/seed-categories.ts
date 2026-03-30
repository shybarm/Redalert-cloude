/**
 * Seed script to populate categories in the database.
 * Run with: npx ts-node scripts/seed-categories.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "electronics", nameHe: "אלקטרוניקה", nameEn: "Electronics", icon: "Monitor", sortOrder: 1 },
  { slug: "mobile-phones", nameHe: "טלפונים ניידים", nameEn: "Mobile Phones", icon: "Smartphone", sortOrder: 2 },
  { slug: "computers", nameHe: "מחשבים וטאבלטים", nameEn: "Computers & Tablets", icon: "Laptop", sortOrder: 3 },
  { slug: "furniture", nameHe: "ריהוט", nameEn: "Furniture", icon: "Armchair", sortOrder: 4 },
  { slug: "home-appliances", nameHe: "מכשירי חשמל", nameEn: "Home Appliances", icon: "Refrigerator", sortOrder: 5 },
  { slug: "fashion", nameHe: "אופנה וביגוד", nameEn: "Fashion & Clothing", icon: "Shirt", sortOrder: 6 },
  { slug: "sports", nameHe: "ספורט", nameEn: "Sports", icon: "Dumbbell", sortOrder: 7 },
  { slug: "baby-kids", nameHe: "תינוקות וילדים", nameEn: "Baby & Kids", icon: "Baby", sortOrder: 8 },
  { slug: "books", nameHe: "ספרים", nameEn: "Books", icon: "BookOpen", sortOrder: 9 },
  { slug: "music", nameHe: "כלי נגינה", nameEn: "Musical Instruments", icon: "Music", sortOrder: 10 },
  { slug: "gaming", nameHe: "גיימינג", nameEn: "Gaming", icon: "Gamepad2", sortOrder: 11 },
  { slug: "vehicles", nameHe: "כלי רכב", nameEn: "Vehicles", icon: "Car", sortOrder: 12 },
  { slug: "collectibles", nameHe: "אספנות ווינטג'", nameEn: "Collectibles & Vintage", icon: "Gem", sortOrder: 13 },
  { slug: "tools", nameHe: "כלי עבודה", nameEn: "Tools", icon: "Wrench", sortOrder: 14 },
  { slug: "garden", nameHe: "גינה ושטח", nameEn: "Garden & Outdoor", icon: "TreePine", sortOrder: 15 },
  { slug: "other", nameHe: "אחר", nameEn: "Other", icon: "Package", sortOrder: 16 },
];

async function main() {
  console.log("Seeding categories...");

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        nameHe: cat.nameHe,
        nameEn: cat.nameEn,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
      create: {
        slug: cat.slug,
        nameHe: cat.nameHe,
        nameEn: cat.nameEn,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
      },
    });
    console.log(`  - ${cat.nameHe} (${cat.slug})`);
  }

  console.log("Done! Seeded", CATEGORIES.length, "categories.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
