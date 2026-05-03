'use client'

export default function SupportSection() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Soporte Bagclue
      </h2>
      
      <p className="text-gray-600 mb-6">
        Atención personalizada Bagclue. Escríbenos para dudas sobre pedidos, apartados y envíos.
      </p>
      
      {/* Botones de contacto */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Instagram */}
        <a
          href="https://instagram.com/salebybagcluemx"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors text-center font-medium"
        >
          📷 Instagram
        </a>
        
        {/* WhatsApp - disabled (pendiente número) */}
        <div className="flex-1 px-4 py-3 bg-gray-100 text-gray-400 rounded-lg text-center font-medium cursor-not-allowed">
          💬 WhatsApp (próximamente)
        </div>
        
        {/* Email - disabled (pendiente email) */}
        <div className="flex-1 px-4 py-3 bg-gray-100 text-gray-400 rounded-lg text-center font-medium cursor-not-allowed">
          ✉️ Email (próximamente)
        </div>
      </div>
      
      {/* Información adicional */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Consultas sobre:
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Estado de pedidos y seguimiento</li>
          <li>• Apartados activos y pagos pendientes</li>
          <li>• Envíos, entregas y direcciones</li>
          <li>• Productos, disponibilidad y reservas</li>
        </ul>
      </div>
    </div>
  )
}
