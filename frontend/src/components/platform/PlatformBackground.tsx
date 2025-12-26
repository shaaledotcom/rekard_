"use client";

export function PlatformBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Gradient orbs - indigo/violet theme for platform settings, softer in light mode */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-500/[0.04] dark:bg-indigo-500/[0.08] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-violet-500/[0.05] dark:bg-violet-500/10 rounded-full blur-[100px] translate-x-1/3" />
      <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-purple-500/[0.03] dark:bg-purple-500/[0.06] rounded-full blur-[150px] translate-y-1/2" />
      
      {/* Grid pattern - theme aware */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground) / 0.05) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground) / 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

