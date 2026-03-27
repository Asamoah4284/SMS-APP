import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';

const STORAGE_TOKEN = '@edutrack_parent_token';
const STORAGE_STUDENT = '@edutrack_selected_student';
const STORAGE_LOOKUP_PHONE = '@edutrack_lookup_phone';
const STORAGE_LOOKUP_TOKEN = '@edutrack_lookup_token';
const STORAGE_LOOKUP_CHILDREN = '@edutrack_lookup_children';

async function getMany(keys) {
  return Promise.all(
    keys.map(async (key) => [key, await AsyncStorage.getItem(key)])
  );
}

async function setMany(pairs) {
  await Promise.all(
    pairs.map(([key, value]) => AsyncStorage.setItem(key, value))
  );
}

async function removeMany(keys) {
  await Promise.all(
    keys.map((key) => AsyncStorage.removeItem(key))
  );
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [student, setStudent] = useState(null);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupToken, setLookupToken] = useState(null); // Token from phone lookup
  const [childrenList, setChildrenList] = useState(null); // Children from last lookup
  // 'loading' while we check AsyncStorage on startup
  const [status, setStatus] = useState('loading');

  // Rehydrate from storage on first mount
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedStudent, storedLookupPhone, storedLookupToken, storedLookupChildren] = await getMany([
          STORAGE_TOKEN,
          STORAGE_STUDENT,
          STORAGE_LOOKUP_PHONE,
          STORAGE_LOOKUP_TOKEN,
          STORAGE_LOOKUP_CHILDREN,
        ]);

        const t = storedToken[1];
        const s = storedStudent[1] ? JSON.parse(storedStudent[1]) : null;
        const p = storedLookupPhone[1] || '';
        const lt = storedLookupToken[1] || null;
        const lc = storedLookupChildren[1] ? JSON.parse(storedLookupChildren[1]) : null;

        if (t && s) {
          setToken(t);
          setStudent(s);
        }

        if (p) setLookupPhone(p);
        if (lt) setLookupToken(lt);
        if (Array.isArray(lc) && lc.length > 0) setChildrenList(lc);
      } catch {
        // Corrupted storage — start fresh
      } finally {
        setStatus('ready');
      }
    })();
  }, []);

  /**
   * Look up children by phone number.
   * Returns { children, token } on success or throws with an error message.
   */
  const lookupByPhone = useCallback(async (phone) => {
    const normalizedPhone = phone.trim();
    const res = await fetch(`${API_BASE}/auth/parent/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Lookup failed');
    }

    // Store the lookup result so we can re-show children without another lookup
    setLookupPhone(normalizedPhone);
    setLookupToken(data.token);
    setChildrenList(data.children);

    setMany([
      [STORAGE_LOOKUP_PHONE, normalizedPhone],
      [STORAGE_LOOKUP_TOKEN, data.token],
      [STORAGE_LOOKUP_CHILDREN, JSON.stringify(data.children || [])],
    ]).catch(() => {
      // storage unavailable — user will need to lookup again next launch
    });

    return data; // { children, token }
  }, []);

  const clearLookupCache = useCallback(async () => {
    setLookupPhone('');
    setLookupToken(null);
    setChildrenList(null);

    try {
      await removeMany([
        STORAGE_LOOKUP_PHONE,
        STORAGE_LOOKUP_TOKEN,
        STORAGE_LOOKUP_CHILDREN,
      ]);
    } catch {
      // ignore storage cleanup failures
    }
  }, []);

  /**
   * Call after the parent picks a child.
   * Updates state immediately (triggers navigation), then persists to AsyncStorage.
   */
  const selectChild = useCallback(async (childData, authToken) => {
    // Set state first — this triggers navigation instantly
    setToken(authToken);
    setStudent(childData);
    // Persist in the background so the session survives app restarts
    setMany([
      [STORAGE_TOKEN, authToken],
      [STORAGE_STUDENT, JSON.stringify(childData)],
    ]).catch(() => {/* storage unavailable — session won't survive restart */});
  }, []);

  /**
   * Switch to a different child without signing out.
   * Keeps the lookup result (children list) so child selection screen shows without re-lookup.
   * Only clears the selected student.
   */
  const switchChild = useCallback(async () => {
    // Clear only the selected student — stay "logged in" with the lookup result
    setStudent(null);
    
    // Attempt to clear stored student from AsyncStorage, but don't fail if unavailable
    try {
      await AsyncStorage.removeItem(STORAGE_STUDENT);
    } catch (err) {
      // Native module may not be initialized — that's okay
      console.warn('AsyncStorage unavailable on switchChild (native module may not be initialized)');
    }
  }, []);

  /** Full sign-out */
  const signOut = useCallback(async () => {
    // Clear all authentication state
    setToken(null);
    setStudent(null);
    setLookupPhone('');
    setLookupToken(null);
    setChildrenList(null);
    
    // Attempt to clear storage, but don't fail if AsyncStorage is unavailable
    try {
      await removeMany([
        STORAGE_TOKEN,
        STORAGE_STUDENT,
        STORAGE_LOOKUP_PHONE,
        STORAGE_LOOKUP_TOKEN,
        STORAGE_LOOKUP_CHILDREN,
      ]);
    } catch (err) {
      // Native module may not be initialized — that's okay
      console.warn('AsyncStorage unavailable on signOut (native module may not be initialized)');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ 
        token, 
        student, 
        status, 
        lookupByPhone, 
        selectChild, 
        switchChild, 
        signOut,
        lookupPhone,
        // Expose lookup result so auth screen can show children without re-lookup on switch
        lookupToken,
        childrenList,
        clearLookupCache,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
