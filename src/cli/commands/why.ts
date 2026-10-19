import { UnsupportedFeatureError } from "../../utils/errors.js";

export async function whyCommand(_package: string): Promise<void> {
  throw new UnsupportedFeatureError("why");
}
