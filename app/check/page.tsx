"use client";
// OWNER: Person B — Offer check: the whole flow on a simulated iPhone, stepped with the Space key.
import { useState } from "react";
import type { EndpointCall } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { EndpointTimeline } from "@/components/EndpointTimeline";
import { Phone } from "./_phone/Phone";

export default function OfferCheck() {
  const [calls, setCalls] = useState<EndpointCall[]>([]);
  return (
    <>
      <PageHeader title="Offer check" description="A creator gets a fake brand deal, screenshots it, and shares it to Ultraviolet. Press Space to go step by step." />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Phone onCalls={setCalls} />
        <div className="lg:sticky lg:top-8 lg:self-start">
          <EndpointTimeline calls={calls} />
        </div>
      </div>
    </>
  );
}
