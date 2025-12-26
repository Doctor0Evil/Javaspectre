// Path: src/example/BasicFormExample.js

import React, { useEffect } from "react";
import useFormSpecter from "../react/useFormSpecter.js";

export function BasicFormExample() {
  const { registerField, updateFieldValue, submit, snapshot } = useFormSpecter({
    blockedDomains: ["example.com"],
    onSubmitSuccess: ({ snapshot }) => {
      console.log("Submitted OK", snapshot);
    },
    onSubmitError: ({ errors }) => {
      console.warn("Submit errors", errors);
    },
  });

  useEffect(() => {
    registerField({ name: "email", type: "email", required: true });
    registerField({ name: "age", type: "number", min: 18, max: 120 });
  }, [registerField]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await submit();
      }}
    >
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => updateFieldValue("email", e.target.value)}
      />
      <input
        type="number"
        placeholder="Age"
        onChange={(e) => updateFieldValue("age", e.target.value)}
      />
      <button type="submit">Submit</button>
      <pre>{JSON.stringify(snapshot, null, 2)}</pre>
    </form>
  );
}
