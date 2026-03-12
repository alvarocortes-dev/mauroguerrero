import { Renderer } from "@/core/renderer/Renderer";
import { getLayoutBySlug } from "@/lib/db/layouts";

export default async function HomePage() {
  const layout = await getLayoutBySlug("home");

  return (
    <section className="flex flex-col gap-10">
      <Renderer layout={layout} mode="view" />
    </section>
  );
}
