import Link from 'next/link';
import { BAGCLUE_COLORS } from '@/lib/colors';

type ButtonVariant = 'primary' | 'secondary' | 'link';

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  className?: string;
  target?: string;
  rel?: string;
}

export default function Button({ 
  children, 
  href, 
  onClick, 
  variant = 'primary',
  className = '',
  target,
  rel
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 px-8 py-3 text-sm tracking-widest uppercase font-medium transition-all duration-300';
  
  const variantStyles = {
    primary: `bg-[${BAGCLUE_COLORS.pink.primary}] text-white hover:bg-[${BAGCLUE_COLORS.pink.secondary}] rounded-full shadow-lg shadow-[${BAGCLUE_COLORS.pink.primary}]/30`,
    secondary: `text-[${BAGCLUE_COLORS.pink.primary}] border-2 border-[${BAGCLUE_COLORS.pink.primary}]/30 hover:bg-[${BAGCLUE_COLORS.pink.primary}]/10 rounded-full`,
    link: `text-[${BAGCLUE_COLORS.pink.primary}] hover:text-[${BAGCLUE_COLORS.pink.secondary}] underline underline-offset-4`,
  };

  const fullClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;

  if (href) {
    if (href.startsWith('http')) {
      return (
        <a href={href} className={fullClassName} target={target} rel={rel}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={fullClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={fullClassName}>
      {children}
    </button>
  );
}
