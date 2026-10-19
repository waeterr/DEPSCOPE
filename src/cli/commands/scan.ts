import { UnsupportedFeatureError } from "../../utils/errors.js";

export async function scanCommand(): Promise<void> {
  throw new UnsupportedFeatureError("scan");
}
