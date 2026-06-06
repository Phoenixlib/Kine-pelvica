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

  // Preparar la configuración del embed
  const embedConfig: any = { layout: "month_view" };
  
  if (prefill) {
    if (prefill.name) embedConfig.name = prefill.name;
    if (prefill.email) embedConfig.email = prefill.email;
    if (prefill.attendeePhoneNumber) {
      embedConfig.attendeePhoneNumber = prefill.attendeePhoneNumber;
      embedConfig.phone = prefill.attendeePhoneNumber;
    }
  }

  return (
    <div className="w-full min-h-[750px]">
      <Cal
        calLink={calLink}
        style={{ width: "100%", height: "100%", minHeight: "750px" }}
        config={embedConfig}
      />
    </div>
  );
}
