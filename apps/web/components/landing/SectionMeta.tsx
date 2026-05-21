interface SectionMetaProps {
  num: string;
  label: string;
  centered?: boolean;
}

export function SectionMeta({ num, label, centered = false }: SectionMetaProps) {
  return (
    <div
      className="fv-section-meta"
      style={centered ? { justifyContent: "center" } : undefined}
    >
      <span className="num">{num}</span>
      <span className="rule" />
      <span>{label}</span>
      {centered && <span className="rule" />}
    </div>
  );
}
