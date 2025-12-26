// Path: src/react/useFormSpecter.js

import { useMemo, useRef, useState, useCallback } from "react";
import FormSpecter from "../runtime/FormSpecter.js";

export function useFormSpecter(config) {
  const [snapshot, setSnapshot] = useState(null);
  const specterRef = useRef(null);

  const wrappedConfig = useMemo(
    () => ({
      ...config,
      onReady: (snap) => {
        setSnapshot(snap);
        config.onReady && config.onReady(snap);
      },
      onSubmitAttempt: (snap) => {
        setSnapshot(snap);
        config.onSubmitAttempt && config.onSubmitAttempt(snap);
      },
      onSubmitSuccess: ({ snapshot: snap, meta }) => {
        setSnapshot(snap);
        config.onSubmitSuccess && config.onSubmitSuccess({ snapshot: snap, meta });
      },
      onSubmitError: ({ snapshot: snap, errors }) => {
        setSnapshot(snap);
        config.onSubmitError && config.onSubmitError({ snapshot: snap, errors });
      },
      onAnalyticEvent: (event) => {
        config.onAnalyticEvent && config.onAnalyticEvent(event);
      },
    }),
    [config]
  );

  if (!specterRef.current) {
    specterRef.current = new FormSpecter(wrappedConfig);
  }

  const specter = specterRef.current;

  const registerField = useCallback(
    (descriptor) => specter.registerField(descriptor),
    [specter]
  );

  const updateFieldValue = useCallback(
    (name, value) => {
      const result = specter.updateFieldValue(name, value);
      setSnapshot(specter.getSnapshot());
      return result;
    },
    [specter]
  );

  const submit = useCallback(async () => {
    const result = await specter.submit();
    setSnapshot(specter.getSnapshot());
    return result;
  }, [specter]);

  return {
    specter,
    snapshot,
    registerField,
    updateFieldValue,
    submit,
  };
}

export default useFormSpecter;
