import { useCallback, useEffect, useState } from "react";
import { DataOverview } from "./DataOverview";
import { DataActions } from "./DataActions";
// (no card components used here)
export function DataManagement() {
  const [storage, setStorage] = useState({
    totalBytes: 0,
    websiteBytes: 0,
    settingsBytes: 0,
    cacheBytes: 0,
    quotaBytes: 0,
  });

  function getRuntime(): any {
    return (globalThis as any).browser?.runtime || (globalThis as any).chrome?.runtime;
  }

  async function sendMessage<TRes = any>(msg: any): Promise<TRes> {
    const runtime = getRuntime();
    if (!runtime?.sendMessage) throw new Error("runtime messaging not available");
    const isPromiseApi = !!(globalThis as any).browser;
    return new Promise<TRes>((resolve, reject) => {
      try {
        if (isPromiseApi) {
          runtime.sendMessage(msg).then(resolve).catch(reject);
        } else {
          runtime.sendMessage(msg, (res: any) => {
            const err = (globalThis as any).chrome?.runtime?.lastError;
            if (err) reject(err);
            else resolve(res);
          });
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  const fetchStorage = useCallback(async () => {
    try {
      const res = await sendMessage<{ totalBytes: number; websiteBytes: number; settingsBytes: number; cacheBytes: number; quotaBytes?: number }>({ type: 'GET_STORAGE_USAGE' });
      setStorage({
        totalBytes: res?.totalBytes || 0,
        websiteBytes: res?.websiteBytes || 0,
        settingsBytes: res?.settingsBytes || 0,
        cacheBytes: res?.cacheBytes || 0,
        quotaBytes: res?.quotaBytes || 0,
      });
    } catch {
      setStorage({ totalBytes: 0, websiteBytes: 0, settingsBytes: 0, cacheBytes: 0, quotaBytes: 0 });
    }
  }, []);

  useEffect(() => {
    fetchStorage();
  }, [fetchStorage]);

  return (
    <div className="space-y-6">
      <DataOverview storage={storage} />
      <DataActions onDataChanged={fetchStorage} />
    </div>
  );
}
