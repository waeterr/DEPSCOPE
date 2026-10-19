import { UnsupportedFeatureError } from "../../utils/errors.js";

export async function statsCommand(): Promise<void> {
  throw new UnsupportedFeatureError("stats");
}
