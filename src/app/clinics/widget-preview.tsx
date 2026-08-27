"use client";

import { useEffect } from "react";

export function WidgetPreview({ slug }: { slug: string }) {
  useEffect(() => {
    if (document.querySelector('script[src="/widget.js"]')) return;
    const script = document.createElement("script");
    script.src = "/widget.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return <div data-clinicboost={slug} />;
}
