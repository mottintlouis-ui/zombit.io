// Anonymized commercial & gameplay analytics system

export interface AnalyticsEvent {
  name: string;
  timestamp: number;
  params?: Record<string, string | number | boolean>;
}

class AnalyticsService {
  private eventsLog: AnalyticsEvent[] = [];

  public logEvent(name: string, params?: Record<string, string | number | boolean>) {
    const event: AnalyticsEvent = {
      name,
      timestamp: Date.now(),
      params,
    };
    this.eventsLog.push(event);
    if (this.eventsLog.length > 200) {
      this.eventsLog.shift();
    }
    // Debug log for development preview
    console.log(`[Analytics Telemetry] ${name}:`, params || {});
  }

  public getRecentLogs(): AnalyticsEvent[] {
    return [...this.eventsLog];
  }
}

export const analytics = new AnalyticsService();
