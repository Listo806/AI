import "./Skeleton.css";

/**
 * Reusable shimmer skeleton block. Compose these to mimic real content while
 * data loads. Use `circle` for avatars.
 */
export default function Skeleton({
  width = "100%",
  height = 14,
  radius = 8,
  circle = false,
  className = "",
  style = {},
}) {
  return (
    <span
      className={`sk-block ${circle ? "sk-circle" : ""} ${className}`.trim()}
      style={{
        width,
        height,
        borderRadius: circle ? "50%" : radius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
