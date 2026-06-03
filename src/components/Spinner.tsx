// Loading spinner, centered in its container's full height.
export default function Spinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <div
        role="status"
        aria-label="Loading"
        className="h-9 w-9 animate-spin rounded-full border-[3px] border-outline-variant border-t-primary"
      />
    </div>
  );
}
