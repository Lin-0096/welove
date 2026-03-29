import { CITIES } from "../lib/cities";
import { curateCity } from "../lib/agents/curate";

async function main() {
  const city = CITIES["helsinki"];
  console.log("Running discover (People Love) for Helsinki…");
  await curateCity(city);
  console.log("Done.");
}

main().catch(console.error);
