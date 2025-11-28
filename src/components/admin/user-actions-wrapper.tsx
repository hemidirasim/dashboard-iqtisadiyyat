"use client";

import { useState, useEffect } from "react";
import { UserActions } from "./user-actions";

type UserActionsWrapperProps = {
  userId: string;
  userName: string;
  status: boolean;
  role: number;
};

export function UserActionsWrapper(props: UserActionsWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-10 w-10">
        <span className="sr-only">Yüklənir...</span>
      </div>
    );
  }

  return <UserActions {...props} />;
}




