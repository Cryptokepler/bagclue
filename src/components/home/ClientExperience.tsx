export default function ClientExperience() {
  const pillars = [
    {
      icon: '✈',
      title: 'Sourcing internacional',
      copy: 'Acceso privado a piezas de lujo desde Europa para clientes en México'
    },
    {
      icon: '✓',
      title: 'Piezas verificadas',
      copy: 'Cada pieza certificada por Entrupy con garantía de autenticidad'
    },
    {
      icon: '💎',
      title: 'Curaduría exclusiva',
      copy: 'Solo las mejores marcas de lujo, curadas con criterio y expertise'
    },
    {
      icon: '📅',
      title: 'Pagos semanales',
      copy: 'Aparta tu pieza con flexibilidad. Pagos sin intereses, 4 a 18 semanas'
    }
  ]

  return (
    <section className="bg-[#F5F1ED] py-16 md:py-24 px-6 md:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <h2 className="text-[#3A3431] font-[family-name:var(--font-cormorant)] font-medium text-3xl md:text-4xl text-center mb-12 md:mb-16">
          La experiencia Bagclue
        </h2>
        
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {pillars.map((pillar, index) => (
            <div key={index} className="text-center">
              {/* Icon */}
              <div className="text-[#3A3431] text-[32px] mb-4">
                {pillar.icon}
              </div>
              
              {/* Title */}
              <h3 className="text-[#3A3431] font-[family-name:var(--font-cormorant)] font-medium text-xl mb-3">
                {pillar.title}
              </h3>
              
              {/* Copy */}
              <p className="text-[#2D2420] font-[family-name:var(--font-manrope)] text-sm leading-[1.6]">
                {pillar.copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
