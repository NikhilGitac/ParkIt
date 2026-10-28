export function NavbarAuthSkeleton({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5 animate-pulse" aria-hidden="true">
        <div className="h-11 w-full bg-slate-100 rounded-xl" />
        <div className="h-11 w-full bg-[#2FD08A]/20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center gap-3 animate-pulse" aria-hidden="true">
      <div className="h-10 w-20 bg-slate-100 rounded-xl" />
      <div className="h-10 w-24 bg-[#2FD08A]/20 rounded-xl" />
    </div>
  );
}
