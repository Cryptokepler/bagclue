import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#C9A96E]/10">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl tracking-[0.3em] text-[#C9A96E] mb-4">BAGCLUE</h3>
            <p className="text-sm text-[#F5F0EB]/50 leading-relaxed">New & Preloved Luxury Items<br />MX 🇲🇽 PARIS 🇫🇷<br />Since 2019</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-xs text-[#F5F0EB]/40">Verificado por Entrupy</span>
            </div>
          </div>

          {/* Nav */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#C9A96E] mb-4">Navegación</h4>
            <div className="flex flex-col gap-3">
              {[['/', 'Inicio'], ['/catalogo', 'Catálogo'], ['/apartado', 'Apartado'], ['/paris', 'París 2U'], ['/nosotros', 'Nosotros'], ['/contacto', 'Contacto']].map(([href, label]) => (
                <Link key={href} href={href} className="text-sm text-[#F5F0EB]/50 hover:text-[#C9A96E] transition-colors">{label}</Link>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#C9A96E] mb-4">Marcas</h4>
            <div className="flex flex-col gap-3">
              {['Chanel', 'Hermès', 'Goyard', 'Céline', 'Louis Vuitton', 'Balenciaga'].map(b => (
                <span key={b} className="text-sm text-[#F5F0EB]/50">{b}</span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#C9A96E] mb-4">Contacto</h4>
            <div className="flex flex-col gap-3 text-sm text-[#F5F0EB]/50">
              <a href="https://instagram.com/salebybagcluemx" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A96E] transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                @salebybagcluemx
              </a>
              <span>📍 El Campanario, Querétaro</span>
              <span>🇲🇽 México</span>
            </div>
            <a href="https://ig.me/m/salebybagcluemx" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 bg-[#C9A96E] text-[#0A0A0A] px-5 py-2.5 text-xs tracking-widest uppercase font-medium hover:bg-[#F5F0EB] transition-colors">
              Escríbenos
            </a>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[#C9A96E]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#F5F0EB]/30">© 2019–2026 SALEBYBAGCLUE MX. Todos los derechos reservados.</p>
          <p className="text-xs text-[#F5F0EB]/30">Autenticidad garantizada — Verificado por Entrupy</p>
        </div>
      </div>
    </footer>
  );
}
