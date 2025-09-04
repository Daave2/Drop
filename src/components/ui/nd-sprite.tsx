"use client";

import * as React from "react";

export function NdSprite() {
  const [sprite, setSprite] = React.useState("");

  React.useEffect(() => {
    fetch("/ui/notedrop-ui-sprite-extended.svg")
      .then((res) => res.text())
      .then(setSprite)
      .catch(() => {});
  }, []);

  if (!sprite) {
    return null;
  }

  return (
    <div
      className="hidden"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: sprite }}
    />
  );
}
