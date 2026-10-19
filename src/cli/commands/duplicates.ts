import { UnsupportedFeatureError } from "../../utils/errors.js";

export async function duplicatesCommand(): Promise<void> {
  throw new UnsupportedFeatureError("duplicates");
}
