import AppConfig from "@vulkan/config/app.config";
import { app } from "./main";

export async function start() {
  try {
    app.listen(AppConfig.port, () => {
      console.info(`Server listening in port: ${AppConfig.port}`);
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exit(1);
  }
}
