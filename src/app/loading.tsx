"use client";

import { LoaderIcon } from "lucide-react";

export default function LoadingPage() {
  return (
    <div className="h-screen flex flex-col gap-y-4 items-center justify-center">
      <LoaderIcon className="size-6 stroke-green-500 animate-spin" />
    </div>
  );
}
