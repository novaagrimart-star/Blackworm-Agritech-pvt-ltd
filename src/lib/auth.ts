import { useEffect, useState } from 'react';
export interface UserProfile {
  uid: string;
  fullName: string;
  emailId: string | null;
  role: 'admin' | 'owner' | 'staff' | 'dealer' | 'asm' | 'sr_sales_exec' | 'sales_exec' | 'sales_officer' | 'dev_officer' | 'sr_dev_officer' | 'field_officer' | string;
  mobileNumber?: string;
  address?: string;
  center?: string;
  designation?: string;
  loginId?: string;
  password?: string;
  allowedModules?: string[];
  createdAt: string;
}

export function useAuth() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('blackworm_user_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  return { user: profile, profile, loading };
}
