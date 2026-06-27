/**
 * Booza Think Kernel - Event Bus (Pub/Sub Broker)
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    console.log(`[Kernel EventBus] Subscribed to event: '${event}'`);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        console.log(`[Kernel EventBus] Unsubscribed from event: '${event}'`);
      }
    };
  }

  publish(event, data) {
    console.log(`[Kernel EventBus] Publishing event: '${event}' with payload size:`, data ? Object.keys(data).length : 0);
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[Kernel EventBus] Error in callback for event '${event}':`, err);
      }
    });
  }
}

// Single instance for kernel runtime
const globalEventBus = new EventBus();

module.exports = {
  EventBus,
  eventBus: globalEventBus
};
