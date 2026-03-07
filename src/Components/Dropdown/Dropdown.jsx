import { useRef, useEffect } from "react";
import "./Dropdown.css";

const ProfileDropdown = ({ items, closeDropdown }) => {
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeDropdown]);

  return (
    <div className="dropdown" ref={ref}>
      <div className="dropdown-menu">
        {items.map((item, index) => (
            <button
                className="dropdown-btn"
                key={index}
                onClick={() => {
                    item.onClick();
                    closeDropdown();
                }}
                style={{
                    "--button-bg": item.buttonBg,
                    "--button-color": item.buttonColor,
                    "--button-hover-bg": item.buttonHoverBg,
                    "--button-hover-color": item.buttonHoverColor,
                }}
            >
                {item.icon} {item.label}
            </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileDropdown;
