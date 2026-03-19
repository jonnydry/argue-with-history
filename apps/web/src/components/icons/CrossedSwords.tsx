import { type SVGProps } from "react";

interface CrossedSwordsProps extends SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
}

export function CrossedSwords({
  size = 24,
  strokeWidth = 1.5,
  className,
  ...props
}: CrossedSwordsProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <line x1="3" y1="3" x2="16" y2="16" />
      <path d="M4 1 L3 3 L1 4" />
      <line x1="14.5" y1="12.5" x2="12.5" y2="14.5" />
      <path d="M16 16 L17.5 17.5 L16.5 18.5 L18 20 L20 18 L18.5 16.5 L19.5 15.5 Z" />
      <circle cx="17.25" cy="17.25" r="0.4" fill="currentColor" stroke="none" />

      <line x1="21" y1="3" x2="8" y2="16" />
      <path d="M20 1 L21 3 L23 4" />
      <line x1="9.5" y1="12.5" x2="11.5" y2="14.5" />
      <path d="M8 16 L6.5 17.5 L7.5 18.5 L6 20 L4 18 L5.5 16.5 L4.5 15.5 Z" />
      <circle cx="6.75" cy="17.25" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
