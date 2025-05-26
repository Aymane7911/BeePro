// Backdrop.jsx
export function Backdrop({ onClick }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-10"
      onClick={onClick}
    />
  );
}
