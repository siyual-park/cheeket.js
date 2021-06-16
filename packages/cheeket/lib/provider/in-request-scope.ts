import ProviderWrappingOptions from "./provider-wrapping-options";
import Provider from "./provider";
import { DefaultState } from "../context";
import { Middleware } from "../middleware";
import bindInContext from "./bind-in-context";
import emitCreateEvent from "./emit-create-event";

function inRequestScope<T, State = DefaultState>(
  provider: Provider<T>,
  options: { array: true }
): Middleware<T[], State>;
function inRequestScope<T, State = DefaultState>(
  provider: Provider<T>,
  options?: { array: false | undefined }
): Middleware<T, State>;
function inRequestScope<T, State = DefaultState>(
  provider: Provider<T>,
  options?: ProviderWrappingOptions
): Middleware<T | T[], State> {
  return async (context, next) => {
    const value = await provider(context);
    bindInContext(context, value, options);
    await emitCreateEvent(context.container, value);

    await next();
  };
}

export default inRequestScope;
