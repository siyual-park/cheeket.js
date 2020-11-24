import { EventEmitter2 } from "eventemitter2";

import * as interfaces from "../interfaces";
import Context from "../context/context";
import MutableBindingDictionary from "../binding/mutable-binding-dictionary";
import Request from "../context/request";
import CantResolveError from "../error/cant-resolve-error";
import { EventType } from "../event";
import ChildContainer from "./child-container";

class Container extends EventEmitter2 implements interfaces.Container {
  readonly #bindingDictionary: interfaces.MutableBindingDictionary = new MutableBindingDictionary();

  readonly #containerContext: interfaces.ContainerContext = {
    bindingDictionary: this.#bindingDictionary,
    eventEmitter: this,
  };

  bind<T>(token: interfaces.Token<T>, provider: interfaces.Provider<T>): void {
    this.#bindingDictionary.set(token, provider);
  }

  isBound<T>(token: interfaces.Token<T>): boolean {
    return this.#bindingDictionary.has(token);
  }

  rebind<T>(
    token: interfaces.Token<T>,
    provider: interfaces.Provider<T>
  ): void {
    this.#bindingDictionary.delete(token);
    this.#bindingDictionary.set(token, provider);
  }

  unbind<T>(token: interfaces.Token<T>): void {
    this.#bindingDictionary.delete(token);
  }

  async resolve<T>(token: interfaces.Token<T>): Promise<T> {
    const provider = this.#bindingDictionary.get(token);
    if (provider !== undefined) {
      return this.resolveProvider(provider, token);
    }

    throw new CantResolveError(token, this);
  }

  async resolveAll<T>(token: interfaces.Token<T>): Promise<T[]> {
    const providers = this.#bindingDictionary.getAll(token);
    if (providers.length > 0) {
      return Promise.all(
        providers.map((provider) => this.resolveProvider(provider, token))
      );
    }

    throw new CantResolveError(token, this);
  }

  private async resolveProvider<T>(
    provider: interfaces.Provider<T>,
    token: interfaces.Token<T>
  ): Promise<T> {
    const context = this.createContext(token);
    const value = await provider(context);
    context.request.resolved = value;

    await this.emitAsync(EventType.Resolve, context);

    return value;
  }

  private createContext<T>(token: interfaces.Token<T>): interfaces.Context {
    const request = new Request(token);
    return new Context([this.#containerContext], request);
  }

  createChildContainer(): interfaces.Container {
    return new ChildContainer([this.#containerContext]);
  }

  async clear(): Promise<void> {
    this.#bindingDictionary.clear();

    await this.emitAsync(EventType.Clear, this);
  }
}

export default Container;
