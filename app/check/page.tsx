"use client";
// OWNER: Person B — Offer check: the whole flow on a simulated iPhone, stepped with the Space key.
import { PageHeader } from "@/components/PageHeader";
import { Phone } from "./_phone/Phone";

export default function OfferCheck() {
  return (
    <>
      <PageHeader title="Offer check" description="A creator gets a fake brand deal, screenshots it, and shares it to Ultraviolet. Press Space to go step by step." />
      <Phone />
    </>
  );
}
