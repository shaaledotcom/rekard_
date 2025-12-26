"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Plus, 
  X, 
  Image as ImageIcon,
  Upload
} from "lucide-react";
import type { TicketFormData, SponsorFormData } from "./types";

interface SponsorsSectionProps {
  formData: TicketFormData;
  onChange: (data: Partial<TicketFormData>) => void;
  isReadOnly?: boolean;
}

export function SponsorsSection({
  formData,
  onChange,
  isReadOnly = false,
}: SponsorsSectionProps) {
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const sponsors = formData.sponsors || [];

  const handleAddSponsor = () => {
    onChange({ 
      sponsors: [...sponsors, { title: "", image_url: "" }] 
    });
  };

  const handleRemoveSponsor = (index: number) => {
    onChange({ 
      sponsors: sponsors.filter((_, i) => i !== index) 
    });
  };

  const handleSponsorChange = (index: number, field: keyof SponsorFormData, value: string) => {
    const newSponsors = [...sponsors];
    newSponsors[index] = { ...newSponsors[index], [field]: value };
    onChange({ sponsors: newSponsors });
  };

  const handleImageChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    // Create preview URL and store file
    const previewUrl = URL.createObjectURL(file);
    const newSponsors = [...sponsors];
    newSponsors[index] = { 
      ...newSponsors[index], 
      image_file: file,
      image_url: previewUrl 
    };
    onChange({ sponsors: newSponsors });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <Label className="text-muted-foreground text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4 text-teal-500 dark:text-teal-400" />
          Sponsors & Partners
        </Label>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Showcase sponsors and partners for this ticket
        </p>
      </div>

      {/* Sponsors List */}
      <div className="space-y-4">
        {sponsors.map((sponsor, index) => (
          <div 
            key={index} 
            className="group p-4 rounded-xl bg-secondary/50 border border-border hover:border-foreground/20 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Logo Preview/Upload */}
              <div className="flex-shrink-0">
                {sponsor.image_url ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                    <img
                      src={sponsor.image_url}
                      alt={sponsor.title || "Sponsor"}
                      className="w-full h-full object-cover"
                    />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const newSponsors = [...sponsors];
                          newSponsors[index] = { 
                            ...newSponsors[index], 
                            image_url: "", 
                            image_file: undefined 
                          };
                          onChange({ sponsors: newSponsors });
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-background/80 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    disabled={isReadOnly}
                    className="w-20 h-20 rounded-xl bg-secondary/50 border-2 border-dashed border-border hover:border-teal-500/50 flex flex-col items-center justify-center text-muted-foreground/70 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
                  >
                    <ImageIcon className="h-6 w-6 mb-1" />
                    <span className="text-[10px]">Logo</span>
                  </button>
                )}
                <input
                  ref={(el) => {
                    fileInputRefs.current[index] = el;
                  }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(index, e)}
                  disabled={isReadOnly}
                  className="hidden"
                />
              </div>

              {/* Sponsor Info */}
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Sponsor Name</Label>
                  <Input
                    value={sponsor.title}
                    onChange={(e) => handleSponsorChange(index, "title", e.target.value)}
                    placeholder="Enter sponsor company name"
                    disabled={isReadOnly}
                    className="h-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground/50 rounded-lg"
                  />
                </div>

                {!sponsor.image_url && !isReadOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="w-full bg-secondary/50 border-border text-muted-foreground hover:bg-secondary"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                )}

                <p className="text-[10px] text-muted-foreground/50">
                  Recommended: 200×200px, PNG or JPG
                </p>
              </div>

              {/* Remove Button */}
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSponsor(index)}
                  className="h-8 w-8 text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Add Sponsor Button */}
        {!isReadOnly && (
          <button
            type="button"
            onClick={handleAddSponsor}
            className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-teal-500/50 bg-muted/30 hover:bg-teal-500/5 transition-colors flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-12 h-12 rounded-full bg-secondary/50 group-hover:bg-teal-500/20 flex items-center justify-center transition-colors">
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-teal-500 dark:group-hover:text-teal-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-muted-foreground group-hover:text-foreground text-sm">
                Add Sponsor
              </p>
              <p className="text-xs text-muted-foreground/70">
                Click to add a sponsor or partner
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Empty State Info */}
      {sponsors.length === 0 && (
        <p className="text-xs text-muted-foreground/70 text-center">
          Sponsors help fund your events and add credibility. Add them here!
        </p>
      )}
    </div>
  );
}

