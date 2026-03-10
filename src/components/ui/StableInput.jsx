import { useState, useRef, useEffect } from "react";

// Input that doesn't lose focus on parent re-render
export default function StableInput({ value, onChange, onKeyDown, placeholder, style, type }) {
  const [local, setLocal] = useState(value);
  const ref = useRef(value);

  useEffect(() => {
    if (value !== ref.current) {
      setLocal(value);
      ref.current = value;
    }
  }, [value]);

  return (
    <input
      type={type || "text"}
      value={local}
      placeholder={placeholder}
      style={style}
      onKeyDown={onKeyDown}
      onChange={(e) => {
        const v = e.target.value;
        setLocal(v);
        ref.current = v;
        onChange(e);
      }}
    />
  );
}
