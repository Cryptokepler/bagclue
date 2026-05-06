import { BAGCLUE_COLORS } from '@/lib/colors';

type BadgeType = 'available' | 'sold' | 'reserved' | 'special' | 'auth';

interface BadgeProps {
  type: BadgeType;
  label: string;
  className?: string;
}

export default function Badge({ type, label, className = '' }: BadgeProps) {
  const baseStyles = 'text-[10px] tracking-wider uppercase px-2.5 py-1 border';

  const typeStyles = {
    // Disponible - verde esmeralda
    available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    // Vendido - gris suave
    sold: 'bg-gray-400/20 text-gray-400 border-gray-400/30',
    // Apartado - amarillo pastel
    reserved: `bg-[${BAGCLUE_COLORS.yellow.primary}]/30 text-[${BAGCLUE_COLORS.black}] border-[${BAGCLUE_COLORS.yellow.secondary}]/40`,
    // Badge especial - rosa con pulse
    special: `bg-[${BAGCLUE_COLORS.pink.primary}]/20 text-[${BAGCLUE_COLORS.pink.primary}] border-[${BAGCLUE_COLORS.pink.primary}]/30 animate-pulse`,
    // Autenticidad - charcoal premium discreto
    auth: 'bg-[#1a1a1a]/80 text-white/80 border-white/10',
  };

  return (
    <span className={`${baseStyles} ${typeStyles[type]} ${className}`}>
      {label}
    </span>
  );
}
