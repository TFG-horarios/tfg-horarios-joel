'use client';

export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] bg-background transition-colors duration-300">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}
