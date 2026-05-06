export default function AnnouncementBar() {
  return (
    <div className="bg-[#E85A9A] text-white text-center py-3 px-4 min-h-[40px] flex items-center justify-center">
      <p className="text-sm md:text-base flex flex-wrap items-center justify-center gap-2 md:gap-4">
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Piezas verificadas
        </span>
        <span className="hidden md:inline">·</span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Envíos seguros
        </span>
        <span className="hidden md:inline">·</span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Aparta con pagos semanales
        </span>
      </p>
    </div>
  );
}
