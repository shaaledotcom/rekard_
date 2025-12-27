"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicTicketSponsor } from "@/store/api/dashboardApi";

interface SponsorsSectionProps {
  sponsors?: PublicTicketSponsor[];
}

const SponsorsSection: React.FC<SponsorsSectionProps> = ({ sponsors = [] }) => {
  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <section className="bg-card rounded-lg p-0">
      <h2 className="text-xl font-semibold mb-6">SPONSORS</h2>

      <div className="flex flex-wrap gap-12 justify-start">
        {sponsors.map((sponsor, index) => (
          <div
            key={index}
            className="justify-center flex flex-col items-center"
          >
            <Avatar className="h-32 w-32 mx-auto mb-3">
              <AvatarImage src={sponsor.image_url} alt={sponsor.title} />
              <AvatarFallback>{sponsor.title.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="font-medium text-sm text-center capitalize">
              {sponsor.title}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SponsorsSection;

