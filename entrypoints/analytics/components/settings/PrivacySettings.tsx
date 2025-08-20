import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Lock
} from "lucide-react";

export function PrivacySettings() {
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");

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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await sendMessage<{ exclusions: string[] }>({ type: 'GET_EXCLUSIONS' });
        if (!cancelled) setExclusions(res?.exclusions || []);
      } catch {
        if (!cancelled) setExclusions([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const normalizedNew = useMemo(() => {
    try {
      if (!newDomain) return "";
      const url = newDomain.includes('://') ? newDomain : `https://${newDomain}`;
      const u = new URL(url);
      let host = u.hostname.toLowerCase();
      if (host.startsWith('www.')) host = host.slice(4);
      return host;
    } catch {
      return "";
    }
  }, [newDomain]);

  async function addExclusion() {
    const domain = normalizedNew;
    if (!domain) return;
    try {
      await sendMessage({ type: 'ADD_EXCLUSION', domain });
      setExclusions((prev) => Array.from(new Set([domain, ...prev])));
      setNewDomain("");
    } catch {}
  }

  async function removeExclusion(domain: string) {
    try {
      await sendMessage({ type: 'REMOVE_EXCLUSION', domain });
      setExclusions((prev) => prev.filter((d) => d !== domain));
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Privacy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Control how your data is collected, stored, and used
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <Shield className="h-6 w-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">Your Privacy is Protected</h4>
              <p className="text-sm text-green-700">
                All data is stored locally and encrypted. We never share personal information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Websites */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Exclusions</CardTitle>
          <CardDescription>
            Websites excluded from tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                className="flex-1 h-9 px-3 rounded-md border border-gray-300 text-sm bg-white"
                placeholder="Enter domain e.g. banking-site.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
              />
              <Button variant="outline" onClick={addExclusion} disabled={!normalizedNew}>Add</Button>
            </div>

            {exclusions.length === 0 && (
              <div className="p-3 text-sm text-gray-600 bg-gray-50 rounded">No exclusions yet.</div>
            )}

            {exclusions.map((domain) => (
              <div key={domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{domain}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeExclusion(domain)}>Remove</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
