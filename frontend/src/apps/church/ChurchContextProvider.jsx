// frontend/src/apps/church/ChurchContextProvider.jsx
// Church Think - Capability Context Provider (Platform 3.1)
// Manages Church Think workspace context independently from Platform
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../core/api';
import { useAuth } from '../../App';

const ChurchContext = createContext(null);

export function useChurchContext() {
  const ctx = useContext(ChurchContext);
  if (!ctx) throw new Error('useChurchContext must be used inside ChurchContextProvider');
  return ctx;
}

export function ChurchContextProvider({ children }) {
  const { token, user } = useAuth();

  // Church workspace branding
  const [churchProfile, setChurchProfile] = useState({
    church_name: '신길교회',
    denomination: '기독교대한성결교회',
    primary_color: '#38669b',
    secondary_color: '#2b517d',
    logo_url: '/church_logo.png'
  });

  // Multi-assignment context
  const [assignments, setAssignments] = useState([]);
  const [activeAssignment, setActiveAssignmentState] = useState(() => {
    try {
      const id = localStorage.getItem('activeAssignmentId');
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
      if (id && !isUuid) {
        localStorage.removeItem('activeAssignmentId');
        return null;
      }
      return id || null;
    } catch { return null; }
  });

  // Onboarding states
  const [membershipStatus, setMembershipStatus] = useState('none');
  const [membershipChurchName, setMembershipChurchName] = useState('');

  const [loading, setLoading] = useState(false);

  const fetchMembershipStatus = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiClient('/api/church/membership/status');
      setMembershipStatus(data.status || 'none');
      setMembershipChurchName(data.churchName || '');
    } catch (err) {
      console.warn('[ChurchContext] Failed to fetch membership status:', err.message);
      setMembershipStatus('none');
    }
  }, [token]);

  const fetchChurchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiClient('/api/church/profile');
      setChurchProfile(data);
    } catch (err) {
      console.warn('[ChurchContext] Failed to fetch church profile:', err.message);
    }
  }, [token]);

  const syncContextFromDB = useCallback(async (localAssignments) => {
    try {
      const pref = await apiClient('/api/platform/preferences/church_think/last_context');
      let backendId = pref ? pref.assignment_id : null;
      
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(backendId);
      if (backendId && !isUuid) {
        backendId = null;
      }
      
      if (!backendId && localAssignments.length > 0) {
        // Fallback to primary if DB pref doesn't exist
        const primary = localAssignments.find(a => a.is_primary) || localAssignments[0];
        backendId = primary.id;
      }
      
      if (backendId) {
        localStorage.setItem('activeAssignmentId', backendId);
        setActiveAssignmentState(backendId);
      }
    } catch (err) {
      console.warn('[ChurchContext] Failed to sync context from DB:', err.message);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiClient('/api/church/assignments/me');
      const loadedAssignments = Array.isArray(data) ? data : [];
      setAssignments(loadedAssignments);
      await syncContextFromDB(loadedAssignments);
    } catch (err) {
      console.warn('[ChurchContext] Failed to fetch assignments:', err.message);
    }
  }, [token, syncContextFromDB]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([fetchMembershipStatus(), fetchChurchProfile(), fetchAssignments()]).finally(() => setLoading(false));
  }, [token, fetchMembershipStatus, fetchChurchProfile, fetchAssignments]);

  const setActiveAssignment = useCallback(async (assignmentId) => {
    try {
      // 1. PATCH Preference
      await apiClient('/api/platform/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          service_id: 'church_think',
          preference_key: 'last_context',
          preference_value: { assignment_id: assignmentId }
        })
      });
      // 2. React Context & Local Storage Cache
      localStorage.setItem('activeAssignmentId', assignmentId);
      setActiveAssignmentState(assignmentId);
      
      // 3. Dispatch event for other components to refresh
      window.dispatchEvent(new CustomEvent('church-assignment-changed', { detail: assignmentId }));
    } catch (err) {
      console.error('[ChurchContext] Failed to switch context', err);
    }
  }, []);

  const getActiveAssignmentData = useCallback(() => {
    if (!activeAssignment || assignments.length === 0) return null;
    return assignments.find(a => a.id === activeAssignment) || assignments[0] || null;
  }, [activeAssignment, assignments]);

  const refreshContext = useCallback(async () => {
    await Promise.all([fetchMembershipStatus(), fetchChurchProfile(), fetchAssignments()]);
  }, [fetchMembershipStatus, fetchChurchProfile, fetchAssignments]);

  const activeAssignmentData = getActiveAssignmentData();
  const activeRole = activeAssignmentData?.role_code || user?.role || 'USER';

  let onboardingState = 'no-church';
  if (membershipStatus === 'none') {
    onboardingState = 'no-church';
  } else if (membershipStatus === 'pending') {
    onboardingState = 'pending-church';
  } else if (membershipStatus === 'approved') {
    if (assignments.length === 0) {
      onboardingState = 'no-assignment';
    } else {
      onboardingState = 'active';
    }
  }

  const hasFinanceViewAccess = 
    user?.role === 'SYSTEM_ADMIN' || 
    user?.role === 'AUDITOR' || 
    user?.isAdmin || 
    (onboardingState === 'active' && !['USER', 'MEMBER', 'TEACHER', 'PASTOR_ASSISTANT'].includes(activeRole));

  const value = {
    churchProfile,
    membershipStatus,
    membershipChurchName,
    onboardingState,
    hasFinanceViewAccess,
    activeRole,
    assignments,
    activeAssignmentId: activeAssignment,
    activeAssignment: activeAssignmentData,
    setActiveAssignment,
    loading,
    refreshContext,
    capability: 'church',
    workspaceName: churchProfile.church_name
  };

  return (
    <ChurchContext.Provider value={value}>
      {children}
    </ChurchContext.Provider>
  );
}
