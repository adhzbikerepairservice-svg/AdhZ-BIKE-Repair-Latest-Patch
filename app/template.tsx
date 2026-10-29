// A template (unlike a layout) re-mounts on every navigation, so each page fades in.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page">{children}</div>;
}
