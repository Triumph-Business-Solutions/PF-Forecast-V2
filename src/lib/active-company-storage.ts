export type StoredActiveCompany = {
  id: string;
  name: string;
};

const STORAGE_KEY = "pf-forecast-active-company" as const;
const STORAGE_EVENT = "pf-active-company-change" as const;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadActiveCompany(): StoredActiveCompany | null {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredActiveCompany>;
    if (!parsed || typeof parsed.id !== "string" || typeof parsed.name !== "string") {
      return null;
    }

    return { id: parsed.id, name: parsed.name };
  } catch (error) {
    console.warn("Unable to parse stored active company selection.", error);
    return null;
  }
}

function dispatchStorageEvent() {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}

export function saveActiveCompany(company: StoredActiveCompany | null): void {
  if (!isBrowser()) {
    return;
  }

  const existing = loadActiveCompany();

  if (!company) {
    if (existing) {
      window.localStorage.removeItem(STORAGE_KEY);
      dispatchStorageEvent();
    }
    return;
  }

  if (existing && existing.id === company.id && existing.name === company.name) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
  dispatchStorageEvent();
}

export function subscribeToActiveCompanyChanges(callback: () => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const handleCustomEvent = () => {
    callback();
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(STORAGE_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(STORAGE_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}
