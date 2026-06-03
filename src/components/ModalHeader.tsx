// Shared top bar for full-screen modal pages (Close · title). One component so
// sizing/spacing stay identical across every screen that uses it.
export default function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <header className="flex items-center justify-between border-b border-outline-variant bg-surface px-5 py-4">
      <button onClick={onClose} aria-label="Back" className="text-on-surface-variant">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-lg font-bold">{title}</span>
      <span className="w-8" />
    </header>
  );
}
