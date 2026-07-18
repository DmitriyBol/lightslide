import {useEffect, useLayoutEffect} from 'react';

/**
 * useLayoutEffect on the client, useEffect on the server. Effects never run during SSR
 * either way, but React 18's legacy server renderer warns on every useLayoutEffect — this
 * is the standard silencer so server-rendering consumers get a clean console. Listed in
 * eslint's exhaustive-deps additionalHooks so dependency arrays stay checked.
 */
export const useIsomorphicLayoutEffect =
	typeof window === 'undefined' ? useEffect : useLayoutEffect;
