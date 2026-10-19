import { UnsupportedFeatureError } from "../../utils/errors.js";

export async function treeCommand(): Promise<void> {
  throw new UnsupportedFeatureError("tree");
}
