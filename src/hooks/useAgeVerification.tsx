import { useState, useEffect } from 'react';

export const useAgeVerification = () => {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has already verified their age
    const hasVerified = localStorage.getItem('age_verified');
    
    if (hasVerified) {
      setIsVerified(true);
      setLoading(false);
    } else {
      // Add a small delay to ensure proper rendering
      setTimeout(() => {
        setLoading(false);
        setShowModal(true);
      }, 500);
    }
  }, []);

  const setVerified = () => {
    localStorage.setItem('age_verified', 'true');
    setIsVerified(true);
    setShowModal(false);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return {
    isVerified,
    loading,
    showModal,
    setVerified,
    closeModal
  };
};