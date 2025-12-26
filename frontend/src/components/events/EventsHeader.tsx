"use client";

import { Calendar, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EventsHeaderProps {
  onCreateClick: () => void;
}

export function EventsHeader({ onCreateClick }: EventsHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">My Events</h1>
                <p className="text-sm text-white/50">Create and manage your live experiences</p>
              </div>
            </div>
          </div>

          <Button
            onClick={onCreateClick}
            className="bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95 text-white font-semibold px-6 py-5 rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </Button>
        </div>
      </div>
    </header>
  );
}
