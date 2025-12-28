// spectral-core/excavation/excavation-router.ts

import { ObjectExcavator } from "./object-excavator.js";
import { DeepExcavator } from "./strategies/deep-excavator.js";
import { PhantomExcavator } from "./strategies/phantom-excavator.js";

export class ExcavationRouter {
  static route(layer: string) {
    switch (layer) {
      case "deep":
        return DeepExcavator;
      case "phantom":
        return PhantomExcavator;
      default:
        return ObjectExcavator;
    }
  }
}
