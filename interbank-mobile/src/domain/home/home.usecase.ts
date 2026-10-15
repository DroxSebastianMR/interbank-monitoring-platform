import { homeService } from "@/src/infrastructure/api/home/services/home.service";
import type { HomeResponse } from "@/src/infrastructure/api/home/services/home.types";

export function getHomeSummary(): Promise<HomeResponse> {
  return homeService.getSummary();
}
