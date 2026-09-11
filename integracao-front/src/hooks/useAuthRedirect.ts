import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthSession, getAuthSession } from '../utils/authSession';

export function useRequireAuth(redirectTo = '/') {
  const navigate = useNavigate();

  useEffect(() => {
    const validateSession = () => {
      if (getAuthSession()) {
        return;
      }

      clearAuthSession();
      navigate(redirectTo, { replace: true });
    };

    validateSession();
    window.addEventListener('focus', validateSession);

    return () => {
      window.removeEventListener('focus', validateSession);
    };
  }, [navigate, redirectTo]);
}

export function useRedirectIfAuthenticated(redirectTo = '/main') {
  const navigate = useNavigate();

  useEffect(() => {
    if (getAuthSession()) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);
}
