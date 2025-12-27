"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface GeolocationBlockedMessageProps {
  eventTitle: string;
  userLocation: {
    city: string;
    country_name: string;
  } | null;
}

export const GeolocationBlockedMessage: React.FC<
  GeolocationBlockedMessageProps
> = ({ eventTitle, userLocation }) => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center py-12 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Content Not Available in Your Location
          </h3>
          <p className="text-muted-foreground mb-6">
            The event &quot;{eventTitle}&quot; is not available in your current
            location due to regional restrictions.
          </p>
          {userLocation && (
            <p className="text-sm text-muted-foreground mb-4">
              Detected location: {userLocation.city}, {userLocation.country_name}
            </p>
          )}
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              If you believe this is incorrect, please contact our support team
              for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeolocationBlockedMessage;

