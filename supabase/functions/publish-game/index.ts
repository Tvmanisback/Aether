import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return Response.json({error:"POST required"},{status:405,headers:cors});
 try{
  const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,auth=req.headers.get("Authorization")||"";
  const caller=createClient(url,Deno.env.get("SUPABASE_ANON_KEY")||"",{global:{headers:{Authorization:auth}}}),admin=createClient(url,service);
  const {data:{user},error:userErr}=await caller.auth.getUser();if(userErr||!user)return Response.json({error:"Sign in required"},{status:401,headers:cors});
  const {data:profile}=await admin.from("profiles").select("role").eq("id",user.id).maybeSingle();if(profile?.role!=="admin")return Response.json({error:"Admin access required"},{status:403,headers:cors});
  const {submission_id}=await req.json();if(!submission_id)return Response.json({error:"submission_id required"},{status:400,headers:cors});
  const {data:s,error}=await admin.from("game_submissions").select("*").eq("id",submission_id).single();if(error||!s)return Response.json({error:"Submission not found"},{status:404,headers:cors});
  if(s.status!=="pending_human_review")return Response.json({error:"Submission is not awaiting review"},{status:409,headers:cors});
  const {data:developer}=await admin.from("profiles").select("developer_public_key").eq("id",s.user_id).single();if(!developer?.developer_public_key)return Response.json({error:"Developer authentication key is missing"},{status:409,headers:cors});
  const account=Deno.env.get("R2_ACCOUNT_ID")!,key=Deno.env.get("R2_ACCESS_KEY_ID")!,secret=Deno.env.get("R2_SECRET_ACCESS_KEY")!;
  if(!account||!key||!secret)throw new Error("R2 secrets are not configured.");
  const s3=new S3Client({region:"auto",endpoint:"https://"+account+".r2.cloudflarestorage.com",credentials:{accessKeyId:key,secretAccessKey:secret}});
  const pending=Deno.env.get("R2_PENDING_BUCKET")||"aether-games-pending",published=Deno.env.get("R2_PUBLISHED_BUCKET")||"aether-games-published";
  const listed=await s3.send(new ListObjectsV2Command({Bucket:pending,Prefix:s.package_path+"/"})),objects=listed.Contents||[];
  if(listed.IsTruncated)throw new Error("Submission has too many files for one review operation.");
  if(!objects.length)throw new Error("No uploaded game files found in R2.");
  const exeRel=s.executable_path.replace(s.package_path+"/","");if(!objects.some(o=>o.Key===s.executable_path))throw new Error("Submitted executable is missing.");
  for(const o of objects){if(!o.Key)continue;const rel=o.Key.slice((s.package_path+"/").length);await s3.send(new CopyObjectCommand({Bucket:published,Key:s.id+"/"+rel,CopySource:encodeURIComponent(pending)+"/"+o.Key.split("/").map(encodeURIComponent).join("/")}));}
  const {data:game,error:insertErr}=await admin.from("games").insert({submission_id:s.id,developer_id:s.user_id,title:s.title,description:s.description,package_path:s.id,executable_path:s.id+"/"+exeRel,source_path:"",package_manifest:s.package_manifest,developer_public_key:developer.developer_public_key,status:"approved"}).select().single();
  if(insertErr)throw insertErr;
  const {error:updateErr}=await admin.from("game_submissions").update({status:"approved",reviewed_at:new Date().toISOString()}).eq("id",s.id);if(updateErr)throw updateErr;
  return Response.json({ok:true,game_id:game.id},{headers:cors});
 }catch(e){return Response.json({error:String((e as Error)?.message||e)},{status:500,headers:cors})}
});