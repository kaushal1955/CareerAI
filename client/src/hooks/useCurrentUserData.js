import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile } from '../services/profileService';
import { getCurrentUser } from '../services/userService';

export default function useCurrentUserData() {
  const { isSignedIn, getToken, setUser } = useAuth();
  const [state, setState] = useState({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setState({ user: null, profile: null, loading: false, error: null });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const [userResponse, profileResponse] = await Promise.all([
        getCurrentUser(getToken),
        getMyProfile(getToken),
      ]);

      setUser(userResponse.user);
      setState({
        user: userResponse.user,
        profile: profileResponse.profile,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        user: null,
        profile: null,
        loading: false,
        error: error?.response?.data?.message || error.message || 'Failed to load account data.',
      });
    }
  }, [getToken, isSignedIn, setUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
