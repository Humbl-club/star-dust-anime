import { useState, useEffect } from 'react';

export const useAgeVerification = () => {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has already verified their age
    const hasVerified = localStorage.getItem('age_verified');
    setIsVerified(!!hasVerified);
    setLoading(false);
  }, []);

  const setVerified = () => {
    localStorage.setItem('age_verified', 'true');
    setIsVerified(true);
  };

  return {
    isVerified,
    loading,
    setVerified
  };
};