import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return Response.json({error:"POST required"},{status:405,headers:cors});
  const url=Deno.env.get("SUPABASE_URL")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth=req.headers.get("Authorization")||"";
  const caller=createClient(url,Deno.env.get("SUPABASE_ANON_KEY")||"",{global:{headers:{Authorization:auth}}});
  const admin=createClient(url,service);
  const {data:{user},error:userErr}=await caller.auth.getUser();
  if(userErr||!user)return Response.json({error:"Sign in required"},{status:401,headers:cors});
  const {data:profile}=await admin.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(profile?.role!=="admin")return Response.json({error:"Admin access required"},{status:403,headers:cors});
  const {submission_id}=await req.json();
  if(!submission_id)return Response.json({error:"submission_id required"},{status:400,headers:cors});
  const {data:s,error}=await admin.from("game_submissions").select("*").eq("id",submission_id).single();
  if(error||!s)return Response.json({error:"Submission not found"},{status:404,headers:cors});
  if(s.status!=="pending_human_review")return Response.json({error:"Submission is not awaiting review"},{status:409,headers:cors});
  const {data:developer}=await admin.from("profiles").select("developer_public_key").eq("id",s.user_id).single();
  if(!developer?.developer_public_key)return Response.json({error:"Developer authentication key is missing. Re-approve the developer application after running the key migration."},{status:409,headers:cors});
  const bucket="game-submissions",destBucket="published-games",sourceRoot=s.package_path;
  const listAll=async(path:string):Promise<any[]>=>{
    const {data,error}=await admin.storage.from(bucket).list(path,{limit:1000});
    if(error)throw error;
    const out:any[]=[];
    for(const item of data||[]){
      const child=path+"/"+item.name;
      if(item.id===null)out.push(...await listAll(child));else out.push({name:item.name,path:child});
    }
    return out;
  };
  try{
    const files=await listAll(sourceRoot);
    if(!files.length)throw new Error("No game files found");
    const exeRel=s.executable_path.replace(sourceRoot+"/","");
    if(!files.some(f=>f.path===s.executable_path))throw new Error("The submitted executable is missing from the folder");
    const publicRoot=s.id;
    for(const file of files){
      const rel=file.path.slice(sourceRoot.length+1);
      const {data:blob,error:downloadErr}=await admin.storage.from(bucket).download(file.path);
      if(downloadErr||!blob)throw downloadErr||new Error("Could not read package file");
      const {error:uploadErr}=await admin.storage.from(destBucket).upload(publicRoot+"/"+rel,blob,{upsert:true});
      if(uploadErr)throw uploadErr;
    }
    const {data:game,error:insertErr}=await admin.from("games").insert({
      submission_id:s.id,developer_id:s.user_id,title:s.title,description:s.description,
      package_path:publicRoot,executable_path:publicRoot+"/"+exeRel,source_path:"",package_manifest:s.package_manifest,developer_public_key:developer.developer_public_key,status:"approved"
    }).select().single();
    if(insertErr)throw insertErr;
    const {error:updateErr}=await admin.from("game_submissions").update({status:"approved",reviewed_at:new Date().toISOString()}).eq("id",s.id);
    if(updateErr)throw updateErr;
    return Response.json({ok:true,game_id:game.id},{headers:cors});
  }catch(e){
    return Response.json({error:String(e?.message||e)},{status:500,headers:cors});
  }
});
