/** template.tsx пересоздаётся при каждой навигации — даёт плавный переход между страницами. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-up">{children}</div>;
}
