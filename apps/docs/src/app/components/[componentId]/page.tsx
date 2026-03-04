import { notFound } from "next/navigation";
import { ComponentDocButton } from "./ComponentDocButton";
import { ComponentDocIcon } from "./ComponentDocIcon";
import { ComponentDocGeneric } from "./ComponentDocGeneric";

type Props = { params: Promise<{ componentId: string }> };

export default async function ComponentPage({ params }: Props) {
  const { componentId } = await params;
  const slug = componentId?.toLowerCase().trim();

  if (!slug) {
    notFound();
  }

  if (slug === "button") {
    return <ComponentDocButton />;
  }
  if (slug === "icon") {
    return <ComponentDocIcon />;
  }

  return <ComponentDocGeneric slug={slug} />;
}
