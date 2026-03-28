import { getCity } from "../lib/cities";
import { curateCity, curateCategoryForCity, curateHiddenGemsForCity } from "../lib/agents/curate";

async function main() {
  const city = getCity("helsinki");
  if (!city) throw new Error("Helsinki not found");

  console.log("Starting Helsinki curate pipeline…");

  const tasks: Array<{ label: string; fn: () => Promise<void> }> = [
    { label: "discover",    fn: () => curateCity(city) },
    { label: "cafe",        fn: () => curateCategoryForCity(city, "cafe") },
    { label: "bar",         fn: () => curateCategoryForCity(city, "bar") },
    { label: "restaurant",  fn: () => curateCategoryForCity(city, "restaurant") },
    { label: "hidden-gems", fn: () => curateHiddenGemsForCity(city) },
  ];

  for (const { label, fn } of tasks) {
    console.log(`  [${label}] starting…`);
    try {
      await fn();
      console.log(`  [${label}] done`);
    } catch (err) {
      console.error(`  [${label}] FAILED:`, err);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
