const url = process.env.NOVA_SUPABASE_URL;
const key = process.env.NOVA_SUPABASE_PUBLISHABLE_KEY;
export function supabaseConfigured(){return Boolean(url&&key);}
export async function supabaseFetch(path:string,init:RequestInit={}){
 if(!url||!key) throw new Error("NOVA_SUPABASE_URL and NOVA_SUPABASE_PUBLISHABLE_KEY are required");
 const headers=new Headers(init.headers); headers.set("apikey",key); headers.set("Authorization",`Bearer ${key}`); headers.set("Content-Type","application/json");
 const response=await fetch(`${url}/rest/v1/${path}`,{...init,headers,cache:"no-store"});
 if(!response.ok) throw new Error(`Supabase request failed: ${response.status} ${await response.text()}`);
 return response;
}
