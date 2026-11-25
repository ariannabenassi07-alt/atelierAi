import { useState } from "react";

interface EditorialImageProps {
  src?: string;
  alt: string;
  fallbackLabel?: string;
  className?: string;
}

export function EditorialImage({
  src,
  alt,
  fallbackLabel,
  className = "w-full h-full object-cover",
}: EditorialImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full bg-gradient-to-br from-[#F3F0EA] via-[#EAE4D9] to-[#DDD5C7] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
      >
        <svg
          className="w-12 h-12 text-[#9A7B4F]/60 mb-3"
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20 14L32 8L44 14L50 26L42 29V54H22V29L14 26L20 14Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M27 11C28.5 14 35.5 14 37 11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="font-serif text-base text-[#1A1A1A] leading-snug max-w-[200px]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
