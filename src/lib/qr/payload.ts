import type { PayloadFields, PayloadKind } from "./types";

function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

export function buildPayload(kind: PayloadKind, fields: PayloadFields): string {
  switch (kind) {
    case "url":
      return fields.url.trim();
    case "text":
      return fields.text;
    case "wifi": {
      const ssid = escapeWifi(fields.wifiSsid.trim());
      const pass = fields.wifiAuth === "nopass" ? "" : escapeWifi(fields.wifiPass);
      const hidden = fields.wifiHidden ? "true" : "false";
      return `WIFI:T:${fields.wifiAuth};S:${ssid};P:${pass};H:${hidden};;`;
    }
    case "vcard": {
      const name = escapeVCard(fields.cardName.trim());
      const parts = name.split(/\s+/);
      const last = parts.length > 1 ? (parts.at(-1) ?? "") : "";
      const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : name;
      const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${last};${first};;;`, `FN:${name}`];
      if (fields.cardOrg.trim()) lines.push(`ORG:${escapeVCard(fields.cardOrg.trim())}`);
      if (fields.cardPhone.trim())
        lines.push(`TEL;TYPE=CELL:${escapeVCard(fields.cardPhone.trim())}`);
      if (fields.cardEmail.trim()) lines.push(`EMAIL:${escapeVCard(fields.cardEmail.trim())}`);
      if (fields.cardUrl.trim()) lines.push(`URL:${escapeVCard(fields.cardUrl.trim())}`);
      lines.push("END:VCARD");
      return lines.join("\n");
    }
    case "email": {
      const to = fields.emailTo.trim();
      const params = new URLSearchParams();
      if (fields.emailSubject.trim()) params.set("subject", fields.emailSubject);
      if (fields.emailBody.trim()) params.set("body", fields.emailBody);
      const qs = params.toString();
      return qs ? `mailto:${to}?${qs}` : `mailto:${to}`;
    }
    case "sms": {
      const to = fields.smsTo.trim();
      const body = fields.smsBody;
      return body ? `SMSTO:${to}:${body}` : `SMSTO:${to}`;
    }
  }
}

export function payloadTitle(kind: PayloadKind, fields: PayloadFields): string {
  switch (kind) {
    case "url":
      return fields.url.trim() || "Untitled URL";
    case "text":
      return fields.text.slice(0, 48) || "Untitled text";
    case "wifi":
      return fields.wifiSsid.trim() || "Wi-Fi";
    case "vcard":
      return fields.cardName.trim() || "Contact";
    case "email":
      return fields.emailTo.trim() || "Email";
    case "sms":
      return fields.smsTo.trim() || "SMS";
  }
}

export function isPayloadReady(kind: PayloadKind, fields: PayloadFields): boolean {
  switch (kind) {
    case "url":
      return fields.url.trim().length > 0;
    case "text":
      return fields.text.trim().length > 0;
    case "wifi":
      return fields.wifiSsid.trim().length > 0;
    case "vcard":
      return fields.cardName.trim().length > 0;
    case "email":
      return fields.emailTo.trim().length > 0;
    case "sms":
      return fields.smsTo.trim().length > 0;
  }
}
