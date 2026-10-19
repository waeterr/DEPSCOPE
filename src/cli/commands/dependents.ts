import { UnsupportedFeatureError } from "../../utils/errors.js";

export async function dependentsCommand(_package: string): Promise<void> {
  throw new UnsupportedFeatureError("dependents");
}
