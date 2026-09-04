import type { CSSProperties } from "react";

export function paperTexture(
  backgroundColor: string,
  blendMode: CSSProperties["backgroundBlendMode"] = "multiply"
): CSSProperties {
  return {
    backgroundColor,
    backgroundImage: "url(/images/wonder-paper-texture-final.jpg)",
    backgroundRepeat: "repeat",
    backgroundSize: "768px 768px",
    backgroundBlendMode: blendMode,
  };
}
