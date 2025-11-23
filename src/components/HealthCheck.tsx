
// Health check component for monitoring
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function HealthCheck() {
  const [_status, setStatus] = useState({
    database: 'checking',
    auth: 'checking',
    realtime: 'checking',
    storage: 'checking'
  });

  useEffect(() => {
    checkHealth();
  }, []);

  async function checkHealth() {
    // Check database
    try {
      await supabase.from('users').select('count').limit(0);
      setStatus(s => ({ ...s, database: 'healthy' }));
    } catch {
      setStatus(s => ({ ...s, database: 'error' }));
    }

    // Check auth
    try {
      await supabase.auth.getSession();
      setStatus(s => ({ ...s, auth: 'healthy' }));
    } catch {
      setStatus(s => ({ ...s, auth: 'error' }));
    }

    // Check realtime
    const channel = supabase.channel('health-check');
    channel.subscribe((status: any) => {
      if (status === 'SUBSCRIBED') {
        setStatus(s => ({ ...s, realtime: 'healthy' }));
        channel.unsubscribe();
      } else {
        setStatus(s => ({ ...s, realtime: 'error' }));
      }
    });

    // Check storage
    try {
      await supabase.storage.listBuckets();
      setStatus(s => ({ ...s, storage: 'healthy' }));
    } catch {
      setStatus(s => ({ ...s, storage: 'error' }));
    }
  }

  return null; // Hidden component
}
