// Rate limiter simple en memoria para autenticación
class InMemoryRateLimit {
  private cache = new Map<string, { count: number; resetTime: number }>();

  async limit(identifier: string) {
    const now = Date.now();
    const key = identifier;
    const entry = this.cache.get(key);
    
    // Limpiar entradas expiradas cada cierto tiempo
    this.cleanup();
    
    if (!entry || now > entry.resetTime) {
      this.cache.set(key, { count: 1, resetTime: now + 60000 }); // 1 minuto
      return { 
        success: true, 
        limit: 5, 
        remaining: 4, 
        reset: new Date(now + 60000) 
      };
    }
    
    if (entry.count >= 5) {
      return { 
        success: false, 
        limit: 5, 
        remaining: 0, 
        reset: new Date(entry.resetTime) 
      };
    }
    
    entry.count++;
    return { 
      success: true, 
      limit: 5, 
      remaining: 5 - entry.count, 
      reset: new Date(entry.resetTime) 
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.resetTime) {
        this.cache.delete(key);
      }
    }
  }
}

// Rate limiter para login: máximo 5 intentos por minuto por IP
export const ratelimit = new InMemoryRateLimit();