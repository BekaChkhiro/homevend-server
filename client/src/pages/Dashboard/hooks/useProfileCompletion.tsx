import { useMemo } from "react";
import { User } from "@/contexts/AuthContext";

interface ProfileCompletionFields {
  email: boolean;
  name: boolean;
  phone: boolean;
  avatar: boolean;
  // Add more fields as needed
}

export const useProfileCompletion = (user: User | null) => {
  const completionPercentage = useMemo(() => {
    if (!user) return 0;

    const fields: ProfileCompletionFields = {
      email: !!user.email,
      name: !!user.name,
      phone: !!user.phone,
      avatar: !!user.avatar,
    };

    const totalFields = Object.keys(fields).length;
    const completedFields = Object.values(fields).filter(Boolean).length;
    
    return Math.round((completedFields / totalFields) * 100);
  }, [user]);

  const missingFields = useMemo(() => {
    if (!user) return [];

    const missing: string[] = [];
    if (!user.email) missing.push("ელ. ფოსტა");
    if (!user.name) missing.push("სახელი");
    if (!user.phone) missing.push("ტელეფონი");
    if (!user.avatar) missing.push("ფოტო");

    return missing;
  }, [user]);

  return {
    completionPercentage,
    missingFields,
    isComplete: completionPercentage === 100
  };
};