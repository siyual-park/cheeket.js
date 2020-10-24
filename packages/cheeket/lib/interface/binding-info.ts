import ServiceIdentifier from "./service-identifier";
import Lifecycle from "./lifecycle";
import AccessLimiter from "./access-limiter";
import ValueProvider from "./value-provider";

interface BindingInfo<T> {
  id: ServiceIdentifier<T>;
  lifecycle: Lifecycle;
  accessLimiter: AccessLimiter;
  valueProvider?: ValueProvider<T>;
  value?: T;
}

export default BindingInfo;