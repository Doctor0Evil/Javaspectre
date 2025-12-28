// infrastructure/logging/javaspectre-logger.ts

export class JavaspectreLogger {
  static log(event: string, data: unknown = {}) {
    console.log(JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
      system: "Javaspectre",
    }));
  }
}
