import { setDefaultOptions } from "date-fns";
import { cs } from "date-fns/locale";

export { format } from "date-fns";

setDefaultOptions({
  locale: cs,
});
