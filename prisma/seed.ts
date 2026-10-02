import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const catalog = [
  ["Dunhill Desire", "dunhill-desire.png", false], ["Crush", "crush.png", true],
  ["Chairman", "chairman.png", false], ["Second Wife", "second-wife.png", false],
  ["Sauvage Dior", "sauvage-dior.png", true], ["Good Girl", "good-girl.png", true],
  ["Vampire Blood", "vampire-blood.png", false], ["Imagination", "imagination.png", false],
  ["Bleu de Chanel", "bleu-de-chanel.png", true], ["Gucci Flora", "gucci-flora.png", false],
  ["Creed Aventus", "creed-aventus.png", true], ["Hawas Ice", "hawas-ice.png", false],
  ["Bombshell", "bombshell.png", false], ["Invictus", "invictus.png", false],
  ["Baccarat Rouge", "baccarat-rouge.png", true], ["Cloud by Ariana Grande", "cloud-ariana-grande.png", false]
] as const;

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  for (const [name, image, featured] of catalog) {
    const id = slugify(name);
    await prisma.product.upsert({
      where: { id },
      update: { name, image: `/assets/${image}`, featured },
      create: {
        id, name, brand: "Ease", image: `/assets/${image}`, featured,
        category: null, gender: null, fragranceFamily: null,
        description: null, topNotes: [], heartNotes: [], baseNotes: [],
        available: false,
        variants: { create: [
          { size: "3.5 ml", price: 130, stock: 0, available: false },
          { size: "6 ml", price: 250, stock: 0, available: false }
        ] }
      }
    });
  }
  await prisma.storeConfig.upsert({
    where: { id: 1 }, update: {},
    create: { id: 1, insideCityLabel: "Inside city", outsideCityLabel: "Outside city", insideCityDelivery: 0, outsideCityDelivery: 0 }
  });
}

main().finally(() => prisma.$disconnect());
