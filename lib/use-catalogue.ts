'use client';

import { useEffect, useState } from 'react';
import { api } from './api';
import { cloudes as builtInCloudes, type Cloude } from './cloudes-data';
import { mergeCatalogue } from './cloudes-catalogue';

// One request per page load, shared by every component that asks.
let loaded: Promise<Cloude[]> | null = null;

/**
 * Client side: the live Cloude catalogue (see cloudes-catalogue.ts). Renders the
 * built-in catalogue first — the same markup the server sent — then switches to the
 * admin-managed one once it's fetched, which only differs after the admin changed something.
 */
export function useCatalogue(): Cloude[] {
  const [list, setList] = useState<Cloude[]>(builtInCloudes);
  useEffect(() => {
    let alive = true;
    loaded ??= api.cloudes
      .list()
      .then(mergeCatalogue)
      .catch(() => {
        loaded = null;
        return builtInCloudes;
      });
    loaded.then((l) => alive && setList(l));
    return () => {
      alive = false;
    };
  }, []);
  return list;
}

/** Drop the cached catalogue, e.g. after the admin edits it. */
export function resetCatalogue() {
  loaded = null;
}
