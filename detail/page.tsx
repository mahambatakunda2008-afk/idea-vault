// app/products/idea-vault/detail/page.tsx

import { Suspense } from "react";
import IdeaDetailClient from "../[id]/IdeaDetailClient";

export default function IdeaDetailPage() {
  return (
    <Suspense fallback={null}>
      <IdeaDetailClient />
    </Suspense>
  );
}
