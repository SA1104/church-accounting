/**
 * Booza Think Kernel - Dependency Injection Container & Service Locator
 */

class Container {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
  }

  register(name, instance) {
    console.log(`[Kernel Container] Registering service: ${name}`);
    this.services.set(name, instance);
  }

  registerFactory(name, factoryFn) {
    console.log(`[Kernel Container] Registering factory: ${name}`);
    this.factories.set(name, factoryFn);
  }

  resolve(name) {
    if (this.services.has(name)) {
      return this.services.get(name);
    }
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      const instance = factory(this);
      this.services.set(name, instance);
      return instance;
    }
    throw new Error(`[Kernel Container] Service not found: ${name}`);
  }

  has(name) {
    return this.services.has(name) || this.factories.has(name);
  }

  clear() {
    this.services.clear();
    this.factories.clear();
  }
}

// Global Service Locator instance
const serviceLocator = new Container();

module.exports = {
  Container,
  serviceLocator
};
