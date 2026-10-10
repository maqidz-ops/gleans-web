import { notFound } from "next/navigation";
import { AdminBlogEditor } from "@/components/admin/blog-editor";
export default async function Page({params}:{params:Promise<{module:string;id:string}>}) {const {module,id}=await params;if(module!=="blog")notFound();return <AdminBlogEditor id={id}/>;}
