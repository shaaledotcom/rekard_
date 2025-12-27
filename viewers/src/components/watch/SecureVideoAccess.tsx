"use client";

import React from "react";

interface SecureVideoAccessProps {
  ticketId: string;
  eventId?: number;
  secureToken?: string;
  onAccessGranted?: (sessionToken: string) => void;
  children: React.ReactNode;
}

export const SecureVideoAccess: React.FC<SecureVideoAccessProps> = ({
  children,
}) => {
  return <>{children}</>;
};

export default SecureVideoAccess;

