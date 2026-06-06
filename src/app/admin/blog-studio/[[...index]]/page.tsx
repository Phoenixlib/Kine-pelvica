"use client";

import "~/sanity/useEffectEvent-polyfill";
import { NextStudio } from "next-sanity/studio";
import config from "../../../../../sanity.config";

export default function BlogStudioPage() {
  return (
    <div className="min-h-screen bg-white">
      <NextStudio config={config} />
    </div>
  );
}

