import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "https://esm.sh/@aws-sdk/client-s3@3";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:cors});
function client(){const account=Deno.env.get("R2_ACCOUNT_ID")!,key=Deno.env.get("R2_ACCESS_KEY_ID")!,secret=Deno.env.get("R2_SECRET_ACCESS_KEY")!;if(!account||!key||!secret)throw new Error("R2 secrets are not configured.");return new S3Client({region:"auto",endpoint:"https://"+account+".r2.cloudflarestorage.com",credentials:{accessKeyId:key,secretAccessKey:secret}})}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"POST required"},405);
 try{
  const auth=req.headers.get("Authorization")||"",url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const caller=createClient(url,anon,{global:{headers:{Authorization:auth}}}),admin=createClient(url,service);
  const {data:{user}}=await caller.auth.getUser();if(!user)return json({error:"Sign in required"},401);
  const {data:profile}=await admin.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(!["developer","admin"].includes(profile?.role||""))return json({error:"Developer access required"},403);
  const {action,key,uploadId,partNumber,parts,contentType}=await req.json();
  if(typeof key!=="string"||!key.startsWith(user.id+"/")||key.includes("..")||key.startsWith("/"))return json({error:"Invalid upload path"},400);
  const bucket=Deno.env.get("R2_PENDING_BUCKET")||"aether-games-pending",s3=client();
  if(action==="create"){
   const out=await s3.send(new CreateMultipartUploadCommand({Bucket:bucket,Key:key,ContentType:contentType||"application/octet-stream"}));
   return json({uploadId:out.UploadId});
  }
  if(!uploadId)return json({error:"uploadId required"},400);
  if(action==="sign"){
   if(!Number.isInteger(partNumber)||partNumber<1||partNumber>10000)return json({error:"Invalid part number"},400);
   const signed=await getSignedUrl(s3,new UploadPartCommand({Bucket:bucket,Key:key,UploadId:uploadId,PartNumber:partNumber}),{expiresIn:3600});
   return json({url:signed});
  }
  if(action==="complete"){
   if(!Array.isArray(parts)||!parts.length)return json({error:"Parts required"},400);
   const out=await s3.send(new CompleteMultipartUploadCommand({Bucket:bucket,Key:key,UploadId:uploadId,MultipartUpload:{Parts:parts.map((p:any)=>({PartNumber:p.PartNumber,ETag:p.ETag}))}}));
   return json({ok:true,etag:out.ETag});
  }
  if(action==="abort"){await s3.send(new AbortMultipartUploadCommand({Bucket:bucket,Key:key,UploadId:uploadId}));return json({ok:true});}
  return json({error:"Unknown action"},400);
 }catch(e){return json({error:String((e as Error)?.message||e)},500)}
});