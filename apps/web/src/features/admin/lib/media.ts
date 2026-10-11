export type AdminMedia = {id:string;name:string;alt:string;size:number;blob?:Blob;src?:string};
export function validateMedia(file:File) {
 if(!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type))throw new Error("Gunakan gambar PNG, JPG, WebP, atau GIF.");
 if(!file.size || file.size>10*1024*1024)throw new Error("Ukuran gambar maksimal 10 MB.");
}
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
 const request=indexedDB.open("gleans-admin-media-demo",1);
 request.onupgradeneeded=()=>{const store=request.result.createObjectStore("media",{keyPath:"id"});store.put({id:"sample-edukasi",name:"Cover edukasi",alt:"Contoh cover artikel edukasi Gleans",size:0,src:"/images/blog-thumbnail-edukasi.jpg"});store.put({id:"sample-tutorial",name:"Cover tutorial",alt:"Contoh cover artikel tutorial Gleans",size:0,src:"/images/blog-thumbnail-tutorial.jpg"});};
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error("Penyimpanan media browser tidak tersedia."));
});}
export async function mediaStore(action:"list"|"put"|"delete",value?:AdminMedia|string):Promise<AdminMedia[]>{
 const db=await database();try{return await new Promise((resolve,reject)=>{
 const tx=db.transaction("media",action==="list"?"readonly":"readwrite");const store=tx.objectStore("media");
 if(action==="put")store.put(value);if(action==="delete")store.delete(value as string);
 const request=store.getAll();let result:AdminMedia[]=[];request.onsuccess=()=>{result=request.result;};
 tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(new Error("Media tidak dapat disimpan. Periksa kapasitas browser."));tx.onabort=()=>reject(new Error("Penyimpanan media dibatalkan."));
 });}finally{db.close();}
}
