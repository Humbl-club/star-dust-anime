import { useState, useEffect } from 'react';

export const useAgeVerification = () => {
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    // Initialize state from localStorage immediately
    return localStorage.getItem('age_verified') === 'true';
  });
  const [loading, setLoading] = useState(false);

  const setVerified = () => {
    console.log('✅ Age verification: Setting verified');
    localStorage.setItem('age_verified', 'true');
    setIsVerified(true);
  };

  // Modal should show when not loading and not verified
  const showModal = !loading && !isVerified;
  console.log('🔍 Age verification: showModal =', showModal, 'loading =', loading, 'isVerified =', isVerified);

  return {
    isVerified,
    loading,
    showModal,
    setVerified
  };
};