import { ComponentsSidenav } from "./ComponentsSidenav";

export default function ComponentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="nds-components-layout">
      <ComponentsSidenav />
      <div className="nds-components-main">{children}</div>
    </div>
  );
}
