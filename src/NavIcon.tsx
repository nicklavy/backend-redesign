import React from "react";

type NavIconProps = {
  src: string;         // URL string (e.g., imported SVG/PNG)
  size?: number;       // px
  alt?: string;
  className?: string;
};

export default function NavIcon({ src, size = 18, alt = "", className }: NavIconProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        lineHeight: 0,
      }}
    >
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </span>
  );
}