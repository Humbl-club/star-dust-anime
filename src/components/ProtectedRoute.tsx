import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
  showMessage?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  fallbackPath = '/auth',
  showMessage = true 
}: ProtectedRouteProps) => {
  // BYPASS AUTHENTICATION FOR TESTING - ALWAYS RENDER CHILDREN
  return <>{children}</>;
};