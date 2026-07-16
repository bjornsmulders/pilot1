export const dynamic = "force-dynamic";

export default function UitnodigingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <span className="mb-8 text-xl font-semibold text-primary">JourneyOS</span>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
