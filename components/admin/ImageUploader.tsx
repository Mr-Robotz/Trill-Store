"use client";

import * as React from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "../ui/button";


export function ImageUploader({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const genUrl = useMutation(api.files.generateUploadUrl);
  const getUrl = useMutation(api.files.getUrl as any); // query used like mutation not allowed; so we do a small route instead below
  const [loading, setLoading] = React.useState(false);

  async function upload(file: File) {
    setLoading(true);
    try {
      const uploadUrl = await genUrl();

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const json = await res.json(); // { storageId }
      const storageId = json.storageId as string;

      // We can't call a Convex query with useMutation; instead: call a tiny Next route to resolve URL.
      const r2 = await fetch("/api/files/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageId }),
      });
      const j2 = await r2.json();
      const url = j2.url as string;

      onUploaded(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm glass rounded-md px-3 h-10 flex items-center cursor-pointer hover:bg-accent/40">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.currentTarget.value = "";
          }}
        />
        {loading ? "Uploading…" : "Upload image"}
      </label>

      <Button type="button" variant="outline" className="rounded-md" disabled>
        Storage
      </Button>
    </div>
  );
}