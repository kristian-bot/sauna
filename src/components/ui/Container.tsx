export function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 ${className}`}>
      {children}
    </div>
  );
}
