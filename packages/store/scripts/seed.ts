import { sql } from "drizzle-orm";

import { db } from "../src/db";
import { dishes } from "../src/db/schema";

/**
 * Stock the menu. Run once per shop database, and again whenever the menu below
 * changes: it upserts on the dish id, so a rerun updates prices and photos and
 * never duplicates a dish.
 *
 *   TURSO_DATABASE_URL=… TURSO_DATABASE_SECRET=… pnpm --filter @cookbook/store db:seed
 */
const MENU = [
  {
    id: "party-jollof-chicken",
    title: "Party jollof & chicken",
    description: "Smoky party jollof with a quarter grilled chicken and fried plantain.",
    priceKobo: 350000,
    category: "Rice",
    imageUrl:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Jollof_rice_with_vegetable.jpg/960px-Jollof_rice_with_vegetable.jpg",
  },
  {
    id: "egusi-soup-pounded-yam",
    title: "Egusi soup & pounded yam",
    description: "Thick egusi with assorted meat and stockfish, served with a wrap of pounded yam.",
    priceKobo: 450000,
    category: "Soups",
    imageUrl:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Pot_of_Egusi_soup.jpg/960px-Pot_of_Egusi_soup.jpg",
  },
  {
    id: "beef-suya-large",
    title: "Beef suya (large)",
    description: "Spicy grilled beef suya with yaji, sliced onions and tomatoes.",
    priceKobo: 300000,
    category: "Grills",
    imageUrl:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/08/Suya_Seller.jpg/960px-Suya_Seller.jpg",
  },
  {
    id: "dodo-fried-plantain",
    title: "Dodo (fried plantain)",
    description: "Ripe plantain fried golden. A side, or a snack on its own.",
    priceKobo: 150000,
    category: "Snacks",
    imageUrl:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Dodo_fried.jpg/960px-Dodo_fried.jpg",
  },
  {
    id: "pounded-yam-vegetable-soup",
    title: "Pounded yam & vegetable soup",
    description: "Smooth pounded yam with efo riro, cooked with palm oil and assorted meat.",
    priceKobo: 400000,
    category: "Swallow",
    imageUrl:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/33/POUNDED_YAM_%26_VEGETABLE_SOUP._A_native_delicacy_of_the_Yoruba_tribe_in_Nigeria%2C_West_Africa..jpg/960px-POUNDED_YAM_%26_VEGETABLE_SOUP._A_native_delicacy_of_the_Yoruba_tribe_in_Nigeria%2C_West_Africa..jpg",
  },
  {
    id: "puff-puff-10-pieces",
    title: "Puff-puff (10 pieces)",
    description: "Soft, sweet, deep-fried dough balls, fresh out of the oil.",
    priceKobo: 100000,
    category: "Snacks",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/a/a3/Nigerian-puff-puff-recipe_cropped.jpg",
  },
  {
    id: "goat-meat-pepper-soup",
    title: "Goat meat pepper soup",
    description: "Peppery goat meat soup with uziza and scent leaves, served with bread.",
    priceKobo: 350000,
    category: "Soups",
    imageUrl:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Goat_meat_pepper_soup_served_with_bread.jpg/960px-Goat_meat_pepper_soup_served_with_bread.jpg",
  },
  {
    id: "chapman-large",
    title: "Chapman (large)",
    description: "The classic Nigerian cocktail: Fanta, Sprite, grenadine and bitters over ice.",
    priceKobo: 150000,
    category: "Drinks",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/6b/Chapman_in_a_punch_bowl.jpg",
  },
  {
    id: "moi-moi-stew",
    title: "Moi moi & stew",
    description: "Steamed bean pudding with egg and fish, served with tomato stew.",
    priceKobo: 200000,
    category: "Meals",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/2e/Moi-moi_with_stew.jpg",
  },
];

async function main() {
  const now = Date.now();
  for (const [index, dish] of MENU.entries()) {
    await db
      .insert(dishes)
      .values({ ...dish, available: true, createdAt: new Date(now + index) })
      .onConflictDoUpdate({
        target: dishes.id,
        set: {
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          priceKobo: sql`excluded.price_kobo`,
          category: sql`excluded.category`,
          imageUrl: sql`excluded.image_url`,
        },
      });
  }
  console.log(`Menu stocked: ${MENU.length} dishes.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
