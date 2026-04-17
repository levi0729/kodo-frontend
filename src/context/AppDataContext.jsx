import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { users as usersApi, teams as teamsApi, friends as friendsApi } from '@/services/api';
import { useAuth } from './AuthContext';

const AppDataContext = createContext(null);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function AppDataProvider({ children }) {
  const { currentUser } = useAuth();

  const [allUsers, setAllUsers] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const cacheTimestamps = useRef({ users: 0, teams: 0, friends: 0 });

  const isFresh = (key) => Date.now() - cacheTimestamps.current[key] < CACHE_TTL;

  const fetchUsers = useCallback(async (force = false) => {
    if (!force && isFresh('users') && allUsers.length > 0) return allUsers;
    try {
      const res = await usersApi.list();
      const data = res.users || res.data || [];
      setAllUsers(data);
      cacheTimestamps.current.users = Date.now();
      return data;
    } catch {
      return allUsers;
    }
  }, [allUsers]);

  const fetchTeams = useCallback(async (force = false) => {
    if (!force && isFresh('teams') && userTeams.length > 0) return userTeams;
    try {
      const res = await teamsApi.list();
      const data = res.teams || res.data || [];
      setUserTeams(data);
      cacheTimestamps.current.teams = Date.now();
      return data;
    } catch {
      return userTeams;
    }
  }, [userTeams]);

  const fetchFriends = useCallback(async (force = false) => {
    if (!force && isFresh('friends') && friendsList.length > 0) return friendsList;
    try {
      const [friendsRes, pendingRes] = await Promise.all([
        friendsApi.list().catch(() => ({ friends: [] })),
        friendsApi.pending().catch(() => ({ pending_requests: [] })),
      ]);
      const friends = friendsRes.friends || friendsRes.data || [];
      const pending = pendingRes.pending_requests || pendingRes.data || [];
      setFriendsList(friends);
      setPendingRequests(pending);
      cacheTimestamps.current.friends = Date.now();
      return friends;
    } catch {
      return friendsList;
    }
  }, [friendsList]);

  const invalidate = useCallback((key) => {
    if (key) {
      cacheTimestamps.current[key] = 0;
    } else {
      cacheTimestamps.current = { users: 0, teams: 0, friends: 0 };
    }
  }, []);

  // Pre-fetch on login
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchTeams();
      fetchFriends();
    }
  }, [currentUser?.id]);

  return (
    <AppDataContext.Provider value={{
      allUsers, setAllUsers, fetchUsers,
      userTeams, setUserTeams, fetchTeams,
      friendsList, setFriendsList, fetchFriends,
      pendingRequests, setPendingRequests,
      invalidate,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
