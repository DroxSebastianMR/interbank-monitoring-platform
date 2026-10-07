import { systemService } from "@/src/infrastructure/api/system/system.service";

export async function verifyBackendAvailability(): Promise<void> {
  await systemService.health();
}
