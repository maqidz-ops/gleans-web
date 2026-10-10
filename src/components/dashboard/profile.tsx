"use client";
import Link from "next/link";
import {MoreVertical,Monitor,Sun,Moon,LogOut} from "lucide-react";
import {Button} from "@/components/ui/button";
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuLabel,DropdownMenuRadioGroup,DropdownMenuRadioItem,DropdownMenuSeparator,DropdownMenuItem} from "@/components/ui/dropdown-menu";
import {useDashboard} from "./provider";
type Appearance = "system" | "light" | "dark";
export function DashboardProfile({theme,onTheme,close,email,name}:{theme:Appearance;onTheme:(theme:Appearance)=>void;close?:()=>void;email:string;name:string}) {
 const {leaveDemo}=useDashboard();
 return <div className="mt-auto pt-4"><div className="flex min-w-0 items-center gap-3">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src="/images/admin-profile.png" alt="Logo Gleans" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover"/>
 <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="mt-1 truncate text-xs text-muted-foreground" title={email}>{email}</p></div>
 <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Menu profil pengguna" className="shrink-0 rounded-full"><MoreVertical className="size-5"/></Button></DropdownMenuTrigger><DropdownMenuContent side="top" align="end" sideOffset={12} className="w-52 rounded-2xl p-1.5"><DropdownMenuLabel>Tampilan</DropdownMenuLabel><DropdownMenuRadioGroup value={theme} onValueChange={value=>onTheme(value as Appearance)}>{[{value:"system",label:"System",icon:Monitor},{value:"light",label:"Light",icon:Sun},{value:"dark",label:"Dark",icon:Moon}].map(item=><DropdownMenuRadioItem key={item.value} value={item.value} className="min-h-10 cursor-pointer gap-3 rounded-xl px-3 pr-9"><item.icon className="size-4"/>{item.label}</DropdownMenuRadioItem>)}</DropdownMenuRadioGroup><DropdownMenuSeparator/><DropdownMenuItem variant="destructive" className="min-h-10 cursor-pointer gap-3 rounded-xl px-3" asChild><Link href="/masuk" onClick={()=>{close?.();leaveDemo();}}><LogOut className="size-4"/>Keluar</Link></DropdownMenuItem></DropdownMenuContent></DropdownMenu>
 </div></div>;
}
