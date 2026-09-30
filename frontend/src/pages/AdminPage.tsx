import { useEffect, useState } from 'react';
import type { Restaurant } from '@turku-lunch/shared';
import Header from '../components/Header';
import { api } from '../services/api';

export default function AdminPage(){
 const [token,setToken]=useState(()=>sessionStorage.getItem('adminToken')||''); const [items,setItems]=useState<Restaurant[]>([]); const [msg,setMsg]=useState('');
 useEffect(()=>{api.restaurants().then(setItems).catch(()=>{});},[]);
 const saveToken=(v:string)=>{setToken(v);sessionStorage.setItem('adminToken',v)};
 const refresh=async()=>{setMsg('Päivitetään…');try{const r=await api.refreshAll(token);setMsg(`Päivitetty ${r.refreshed} ravintolaa.`);setItems(await api.restaurants());}catch(e){setMsg((e as Error).message)}};
 const toggle=async(r:Restaurant)=>{try{const updated=await api.updateRestaurant(token,r.id,{active:!r.active});setItems(items.map(x=>x.id===r.id?updated:x));}catch(e){setMsg((e as Error).message)}};
 return <><Header/><main className="mx-auto max-w-4xl p-4"><h1 className="text-2xl font-bold">Admin</h1><div className="card mt-4 p-4"><label className="text-sm">ADMIN_SECRET<input className="input mt-1" type="password" value={token} onChange={e=>saveToken(e.target.value)}/></label><button className="btn btn-primary mt-3" onClick={refresh}>Päivitä kaikki ruokalistat</button>{msg&&<p className="mt-2 text-sm">{msg}</p>}</div><div className="mt-4 space-y-2">{items.map(r=><div key={r.id} className="card flex items-center justify-between p-4"><div><div className="font-medium">{r.name}</div><div className="text-xs text-slate-500">{r.menuUrl}</div></div><button className="btn border" onClick={()=>toggle(r)}>{r.active?'Poista käytöstä':'Aktivoi'}</button></div>)}</div></main></>;
}
