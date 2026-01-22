class BostromRpcHealth {
  constructor() {
    this.health = 'healthy';
    this.fallbackEndpoint = 'https://fallback.bostrom.cybernode.ai';
  }

  async checkHealth() {
    try {
      const response = await fetch('https://rpc.bostrom.cybernode.ai/health');
      if (!response.ok) throw new Error('RPC unhealthy');
      this.health = 'healthy';
    } catch (err) {
      this.health = 'degraded';
      console.error('RPC health check failed:', err);
    }
  }

  getFallbackEndpoint() {
    return this.fallbackEndpoint;
  }
}
