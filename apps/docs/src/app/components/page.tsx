import { redirect } from "next/navigation";

/** Overview Components: reindirizza alla prima voce della sidenav (Button). */
export default function ComponentsPage() {
  redirect("/components/button");
}
