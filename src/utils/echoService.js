import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getStorage } from "./commonfunction";

// Make Pusher available globally (required for Echo)
window.Pusher = Pusher;

// Create and initialize the Echo instance
let echo = null;

// Function to initialize Echo (can be called multiple times safely)
const initEcho = () => {
  try {
    // Get user data from storage
    const user = getStorage("user", true);
    
    if (!user || !user.token) {
      console.error("User token not available for Echo initialization");
      return null;
    }

    // Only initialize echo if it doesn't exist yet
    if (!echo) {
      // Create new Echo instance with proper configuration
      echo = new Echo({
        broadcaster: "pusher", // Use 'pusher' as broadcaster when using Reverb
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: parseInt(import.meta.env.VITE_REVERB_PORT),
        wssPort: parseInt(import.meta.env.VITE_REVERB_PORT),
        forceTLS: false, // Set to true if using secure connections
        encrypted: false, // Set to true for secure connections
        disableStats: true,
        enabledTransports: ["ws", "wss"],
        cluster: "mt1", // You can use default cluster here
        authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
        auth: {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        },
      });

      // Set up debugging for development
      if (import.meta.env.DEV) {
        echo.connector.pusher.connection.bind('connected', () => {
          console.log('Connected to Reverb server successfully!');
        });
        
        echo.connector.pusher.connection.bind('error', (err) => {
          console.error('Reverb connection error:', err);
        });
      }

      console.log("Echo initialized successfully");
    }
    
    return echo;
  } catch (error) {
    console.error("Error initializing Echo:", error);
    return null;
  }
};

// Initialize Echo on import
// It's better to call this function explicitly where needed
// rather than initializing on import
// initEcho();

// Export both the Echo instance and init function
export default echo;
export { initEcho };