"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

export function InquiryForm() {
  const [status, setStatus] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();

    if (!name || !email || !message) {
      setStatus("Add your name, email, and message before sending.");
      return;
    }

    setStatus("Thanks. This web form is prepared, but it does not store submissions yet. Use phone, email, or Instagram to contact 365 Fitness now.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="label-xs text-bone-dim" htmlFor="name">Name</label>
          <input id="name" name="name" className="input mt-2" placeholder="Your name" />
        </div>
        <div>
          <label className="label-xs text-bone-dim" htmlFor="email">Email</label>
          <input id="email" name="email" className="input mt-2" type="email" placeholder="you@example.com" />
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="label-xs text-bone-dim" htmlFor="phone">Phone</label>
          <input id="phone" name="phone" className="input mt-2" placeholder="+1 473..." />
        </div>
        <div>
          <label className="label-xs text-bone-dim" htmlFor="interest">Service Interest</label>
          <select id="interest" name="interest" className="input mt-2">
            <option>Personal Training</option>
            <option>Strength Training</option>
            <option>Athletic Training</option>
            <option>At-Home Training</option>
            <option>Hybrid Programs</option>
            <option>Online Coaching</option>
            <option>Nutrition</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label-xs text-bone-dim" htmlFor="message">Goal</label>
        <textarea id="message" name="message" className="input mt-2 min-h-36" placeholder="Tell 365 Fitness what you want help with." />
      </div>
      <Button type="submit">Send</Button>
      {status ? <p className="border-l-2 border-teal p-4 text-sm font-semibold text-bone-dim">{status}</p> : null}
    </form>
  );
}
