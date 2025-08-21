import { useEffect, useState, useCallback } from "react";
import { initEcho } from "./echoService";

export const useReverb = (channelName, eventName) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Reset data function
  const resetData = useCallback(() => setData(null), []);

  useEffect(() => {
    // Initialize variables
    let echoInstance = null;
    let channel = null;
    let unsubscribeCallback = null;
    let connectionCheckInterval = null;

    const setup = async () => {
      try {
        // Initialize Echo and get the instance
        echoInstance = initEcho();

        if (!echoInstance) {
          console.error("Failed to initialize Echo");
          setError(new Error("Echo initialization failed"));
          setIsConnected(false);
          return;
        }

        // Check if Pusher connection exists
        if (!echoInstance.connector || !echoInstance.connector.pusher) {
          console.error("Echo connector or Pusher not available");
          setError(new Error("Echo connector not available"));
          setIsConnected(false);
          return;
        }

        // Set up connection status checking
        const checkConnectionStatus = () => {
          // Check if connection state is 'connected'
          const isConnectedState =
            echoInstance.connector.pusher.connection.state === "connected";
          setIsConnected(isConnectedState);
          return isConnectedState;
        };

        // Setup connection event listeners
        echoInstance.connector.pusher.connection.bind("connected", () => {
          console.log(`Connected to ${channelName}`);
          setIsConnected(true);
          subscribeToChannel();
        });

        echoInstance.connector.pusher.connection.bind("disconnected", () => {
          console.log(`Disconnected from ${channelName}`);
          setIsConnected(false);
        });

        echoInstance.connector.pusher.connection.bind("error", (err) => {
          console.error("Connection error:", err);
          setError(err);
          setIsConnected(false);
        });

        // Function to subscribe to the channel
        const subscribeToChannel = () => {
          try {
            // Check if we're already subscribed
            if (channel) return;

            // Check if the channel name is valid
            if (!channelName) {
              console.error("Invalid channel name");
              setError(new Error("Invalid channel name"));
              return;
            }

            console.log(
              `Subscribing to channel: ${channelName}, event: ${eventName}`
            );

            // Determine channel type (public, private, presence)
            if (channelName.startsWith("private-")) {
              channel = echoInstance.private(channelName.substring(8));
            } else if (channelName.startsWith("presence-")) {
              channel = echoInstance.join(channelName.substring(9));
            } else {
              channel = echoInstance.channel(channelName);
            }

            // If channel subscription succeeded
            if (channel) {

              // Listen for the specified event
              channel.listen(eventName, (eventData) => {
                setData(eventData);
              });
            } else {
              console.error(`Failed to subscribe to channel: ${channelName}`);
              setError(
                new Error(`Failed to subscribe to channel: ${channelName}`)
              );
            }
          } catch (subscribeError) {
            console.error("Error subscribing to channel:", subscribeError);
            setError(subscribeError);
          }
        };

        // Check initial connection status and subscribe if connected
        if (checkConnectionStatus()) {
          subscribeToChannel();
        }

        // Periodically check connection status (useful for reconnection)
        connectionCheckInterval = setInterval(checkConnectionStatus, 5000);
      } catch (setupError) {
        console.error("Error in Reverb hook setup:", setupError);
        setError(setupError);
        setIsConnected(false);
      }
    };

    // Run the setup
    setup();

    // Cleanup function
    return () => {
      try {
        // Clear interval
        if (connectionCheckInterval) {
          clearInterval(connectionCheckInterval);
        }

        // Remove connection event listeners
        if (
          echoInstance &&
          echoInstance.connector &&
          echoInstance.connector.pusher
        ) {
          echoInstance.connector.pusher.connection.unbind("connected");
          echoInstance.connector.pusher.connection.unbind("disconnected");
          echoInstance.connector.pusher.connection.unbind("error");
        }

        // Leave the channel if subscribed
        if (echoInstance && channelName) {
          echoInstance.leave(channelName);
        }

        // Execute any additional unsubscribe logic
        if (unsubscribeCallback) {
          unsubscribeCallback();
        }
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
    };
  }, [channelName, eventName]);

  return { data, error, isConnected, resetData };
};
