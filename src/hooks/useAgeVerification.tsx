import { useState, useEffect } from 'react';

export const useAgeVerification = () => {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 Age verification: Checking localStorage...');
    // Check if user has already verified their age
    const hasVerified = localStorage.getItem('age_verified');
    console.log('🔍 Age verification: hasVerified =', hasVerified);
    
    if (hasVerified) {
      console.log('✅ Age verification: Already verified');
      setIsVerified(true);
    } else {
      console.log('❌ Age verification: Not verified yet');
    }
    setLoading(false);
  }, []);

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