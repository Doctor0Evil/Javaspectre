// javaspectre/plugins/plugin-registry.ts

export class PluginRegistry {
  private static plugins: Record<string, Function> = {};

  static register(name: string, handler: Function) {
    this.plugins[name] = handler;
  }

  static get(name: string) {
    return this.plugins[name];
  }
}
