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
      const saved = localStorage.getItem('activeAssignmentId');
      return saved || null;
    } catch { return null; }
  });

  // Onboarding states
  const [membershipStatus, setMembershipStatus] = useState('none'); // 'none', 'pending', 'approved', 'rejected'
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

  const fetchAssignments = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiClient('/api/church/assignments/me');
      setAssignments(Array.isArray(data) ? data : []);
      // If no active assignment is set, auto-select primary
      const currentActive = localStorage.getItem('activeAssignmentId');
      if (!currentActive && Array.isArray(data) && data.length > 0) {
        const primary = data.find(a => a.is_primary) || data[0];
        if (primary) {
          localStorage.setItem('activeAssignmentId', primary.id);
          setActiveAssignmentState(primary.id);
        }
      }
    } catch (err) {
      console.warn('[ChurchContext] Failed to fetch assignments:', err.message);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([fetchMembershipStatus(), fetchChurchProfile(), fetchAssignments()]).finally(() => setLoading(false));
  }, [token, fetchMembershipStatus, fetchChurchProfile, fetchAssignments]);

  useEffect(() => {
    const handleAssignmentChange = (e) => {
      const newAssignId = e.detail;
      if (newAssignId) {
        setActiveAssignmentState(newAssignId);
      }
    };
    window.addEventListener('church-assignment-changed', handleAssignmentChange);
    return () => {
      window.removeEventListener('church-assignment-changed', handleAssignmentChange);
    };
  }, []);

  const setActiveAssignment = useCallback((assignmentId) => {
    localStorage.setItem('activeAssignmentId', assignmentId);
    setActiveAssignmentState(assignmentId);
  }, []);

  const getActiveAssignmentData = useCallback(() => {
    if (!activeAssignment || assignments.length === 0) return null;
    return assignments.find(a => a.id === activeAssignment) || assignments[0] || null;
  }, [activeAssignment, assignments]);

  const refreshContext = useCallback(async () => {
    await Promise.all([fetchMembershipStatus(), fetchChurchProfile(), fetchAssignments()]);
  }, [fetchMembershipStatus, fetchChurchProfile, fetchAssignments]);

  // Derived onboarding state and permissions
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
    // Workspace identity
    churchProfile,
    // Onboarding info
    membershipStatus,
    membershipChurchName,
    onboardingState,
    hasFinanceViewAccess,
    activeRole,
    // Assignment context
    assignments,
    activeAssignmentId: activeAssignment,
    activeAssignment: activeAssignmentData,
    setActiveAssignment,
    // Helpers
    loading,
    refreshContext,
    // Capability identifier
    capability: 'church',
    workspaceName: churchProfile.church_name
  };

  return (
    <ChurchContext.Provider value={value}>
      {children}
    </ChurchContext.Provider>
  );
}
