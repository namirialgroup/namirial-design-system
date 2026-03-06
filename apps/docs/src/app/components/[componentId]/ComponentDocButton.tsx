import { readFile } from "fs/promises";
import path from "path";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { ButtonPlayground } from "@/components/ComponentPlayground";
import { Tooltip } from "@/components/Tooltip";
import { AccessibilityTag } from "@/components/AccessibilityTag";

const mdxComponents = {
  Playground: ButtonPlayground,
  Tooltip,
  AccessibilityTag,
};

export async function ComponentDocButton() {
  const filePath = path.join(process.cwd(), "src/content/components/button.mdx");
  const source = await readFile(filePath, "utf-8");

  return (
    <MDXRemote
      source={source}
      components={mdxComponents}
      options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
    />
  );
}
