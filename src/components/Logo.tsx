import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: number;
  showText?: boolean;
  href?: string;
  className?: string;
  textClassName?: string;
}

export default function Logo({
  size = 36,
  showText = true,
  href,
  className = "",
  textClassName = "text-xl font-black tracking-tighter uppercase italic leading-none",
}: LogoProps) {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="rounded-xl overflow-hidden shadow-lg shadow-orange-900/40 shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="Eventra"
          width={size}
          height={size}
          className="object-cover w-full h-full"
          priority
        />
      </div>
      {showText && <span className={textClassName}>Eventra</span>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex-shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
