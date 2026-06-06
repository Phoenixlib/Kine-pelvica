"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

export interface CalComPrefill {
  name?: string;
  email?: string;
  attendeePhoneNumber?: string;
}

interface CalComEmbedProps {
  calLink: string;
  prefill?: CalComPrefill;
  onSuccess?: (e: any) => void;
}

export default function CalComEmbed({ calLink, prefill, onSuccess }: CalComEmbedProps) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        hideEventTypeDetails: false,
        layout: "month_view",
        cssVarsPerTheme: {
          light: {
            "cal-brand": "#c48a6a",
            "cal-brand-emphasis": "#a8725a",
            "cal-brand-text": "#ffffff",
          },
          dark: {
            "cal-brand": "#c48a6a",
            "cal-brand-emphasis": "#a8725a",
            "cal-brand-text": "#ffffff",
          },
        },
      });
      if (onSuccess) {
        cal("on", { action: "bookingSuccessful", callback: onSuccess });
      }
    })();
  }, [onSuccess]);

  // Construir link con parámetros de prefill
  let finalCalLink = calLink;
  if (prefill) {
    const params = new URLSearchParams();
    if (prefill.name) params.append("name", prefill.name);
    if (prefill.email) params.append("email", prefill.email);
    if (prefill.attendeePhoneNumber)
      params.append("attendeePhoneNumber", prefill.attendeePhoneNumber);
    const qs = params.toString();
    if (qs) finalCalLink = `${calLink}?${qs}`;
  }

  return (
    <div className="w-full min-h-[750px]">
      <Cal
        calLink={finalCalLink}
        style={{ width: "100%", height: "100%", minHeight: "750px" }}
        config={{ layout: "month_view" }}
      />
    </div>
  );
}
