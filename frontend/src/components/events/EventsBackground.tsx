"use client";

export function EventsBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Colorful gradient orbs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-red-500/8 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] translate-x-1/3" />
      <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-yellow-500/6 rounded-full blur-[150px] translate-y-1/2" />
      
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

