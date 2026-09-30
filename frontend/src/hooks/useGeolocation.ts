import { useState } from 'react';

export interface UserLocation { latitude: number; longitude: number }

export function useGeolocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) return setError('Sijainti ei ole käytettävissä tässä selaimessa.');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLoading(false);
      },
      () => { setError('Sijaintia ei saatu. Sovellus toimii myös ilman sitä.'); setLoading(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };
  return { location, error, loading, locate };
}
