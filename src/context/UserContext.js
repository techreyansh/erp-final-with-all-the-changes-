import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useAuth } from './AuthContext';
import * as db from '../lib/db';
import config from '../config/config';

const UserContext = createContext(null);

/**
 * Resolve role_id, vendor_id, customer_id, branch_id from a user row (record or top-level).
 * Supports both snake_case and camelCase keys.
 */
function pickIds(row) {
  if (!row || typeof row !== 'object') return { roleId: null, vendorId: null, customerId: null, branchId: null };
  const get = (a, b) => row[a] ?? row[b] ?? null;
  return {
    roleId: get('role_id', 'roleId') ?? null,
    vendorId: get('vendor_id', 'vendorId') ?? null,
    customerId: get('customer_id', 'customerId') ?? null,
    branchId: get('branch_id', 'branchId') ?? null,
  };
}

export const UserProvider = ({ children }) => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const fetchUserProfile = useCallback(async (email) => {
    if (!email) {
      setProfile(null);
      setUserLoading(false);
      return;
    }
    setUserLoading(true);
    setProfileError(null);
    try {
      const tableName = db.getTableName(config.sheets?.users) || 'users';
      const rows = await db.getTableRows(tableName);
      const match = rows.find((u) => (u.Email ?? u.email ?? '').toString().toLowerCase() === email.toLowerCase());
      if (match) {
        setProfile({ id: match.id, ...match });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('UserContext: failed to fetch user profile', err);
      setProfileError(err);
      setProfile(null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      setUserLoading(true);
      return;
    }
    if (!authUser || !authUser.email) {
      setProfile(null);
      setProfileError(null);
      setUserLoading(false);
      return;
    }
    fetchUserProfile(authUser.email);
  }, [authLoading, authUser?.email, fetchUserProfile]);

  const loading = authLoading || userLoading;
  const ids = pickIds(profile);

  const value = {
    /** Current auth user (from AuthContext) */
    authUser,
    /** User row from users table (id + record fields), or null */
    profile,
    /** loading is true while auth or user profile is being resolved */
    loading,
    /** Error from last profile fetch, if any */
    profileError,
    /** role_id from users.record (or null) */
    roleId: ids.roleId,
    /** vendor_id from users.record (or null) */
    vendorId: ids.vendorId,
    /** customer_id from users.record (or null) */
    customerId: ids.customerId,
    /** branch_id from users.record (or null) */
    branchId: ids.branchId,
    /** Re-fetch the current user's profile from the users table */
    refetch: () => authUser?.email && fetchUserProfile(authUser.email),
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
