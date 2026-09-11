import React from "react";
import finyWordmark from "@/assets/brand/finy-wordmark.png";

/** The approved fin!y logo artwork, including Penny's green orb as the i dot. */
export default function FinyMark({ className = "", light = false }) {
  return (
    <img
      src={finyWordmark}
      alt="fin!y"
      className={`finy-wordmark ${light ? "finy-wordmark--light" : ""} ${className}`}
      draggable="false"
    />
  );
}
