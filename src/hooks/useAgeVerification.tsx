import { useState } from 'react';
import { useUserPreferencesStore, useUIStore } from '@/store';

export const useAgeVerification = () => {
  const { ageVerified, setAgeVerified } = useUserPreferencesStore();
  const { modals, setModal } = useUIStore();
  const [loading, setLoading] = useState(false);

  const setVerified = () => {
    console.log('✅ Age verification: Setting verified');
    setAgeVerified(true);
    setModal('ageVerification', false);
  };

  // Modal should show when not loading and not verified
  const showModal = !loading && !ageVerified;
  console.log('🔍 Age verification: showModal =', showModal, 'loading =', loading, 'isVerified =', ageVerified);

  return {
    isVerified: ageVerified,
    loading,
    showModal: showModal || modals.ageVerification,
    setVerified,
    // Enhanced functionality from store
    openModal: () => setModal('ageVerification', true),
    closeModal: () => setModal('ageVerification', false)
  };
};