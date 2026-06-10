import { createRootUser } from "@vulkan/lib/db/create-root";
import { start } from "./start";

export async function startDev() {
  await start();
  await createRootUser();
}
