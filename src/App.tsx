import { useEffect } from 'react';
import { usePeer } from './context/PeerContext';
import { Dashboard } from './components/Dashboard';
import { AlarmOverlay } from './components/AlarmOverlay';
import { requestNotificationPermission, sendNotification } from './lib/notifications';

function App() {
  const { lastAlarm, clearAlarm } = usePeer();

  useEffect(() => {
    // Request permission on mount
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (lastAlarm) {
      const sender = lastAlarm.username || lastAlarm.from;
      sendNotification(`ALARM from ${sender}!`, {
        body: lastAlarm.message ? `Message: ${lastAlarm.message}` : `Urgent alarm received!`,
        requireInteraction: true,
      });
    }
  }, [lastAlarm]);

  return (
    <>
      <Dashboard />
      {lastAlarm && (
        <AlarmOverlay
          onStop={clearAlarm}
          message={lastAlarm.message}
          senderName={lastAlarm.username || lastAlarm.from}
        />
      )}
    </>
  );
}

export default App;
