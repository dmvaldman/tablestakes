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
      <button onClick={onClose} className="text-lg text-on-surface-variant">
        Close
      </button>
      <span className="text-lg font-bold">{title}</span>
      <span className="w-12" />
    </header>
  );
}
