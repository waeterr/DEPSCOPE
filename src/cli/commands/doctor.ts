import { UnsupportedFeatureError } from "../../utils/errors.js";

export async function doctorCommand(): Promise<void> {
  throw new UnsupportedFeatureError("doctor");
}
