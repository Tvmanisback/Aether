import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, GetObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:cors});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"POST required"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,auth=req.headers.get("Authorization")||"";
  const caller=createClient(url,anon,{global:{headers:{Authorization:auth}}});const {data:{user}}=await caller.auth.getUser();if(!user)return json({error:"Sign in required"},401);
  const {game_id}=await req.json();if(!game_id)return json({error:"game_id required"},400);
  const {data:game,error}=await caller.from("games").select("id,package_path,package_manifest,status").eq("id",game_id).eq("status","approved").single();
  if(error||!game)return json({error:"Approved game not found"},404);
  const files=game.package_manifest?.folder_files;if(!Array.isArray(files)||!files.length)return json({error:"Game package manifest is invalid"},409);
  const account=Deno.env.get("R2_ACCOUNT_ID")!,key=Deno.env.get("R2_ACCESS_KEY_ID")!,secret=Deno.env.get("R2_SECRET_ACCESS_KEY")!;
  const s3=new S3Client({region:"auto",endpoint:"https://"+account+".r2.cloudflarestorage.com",credentials:{accessKeyId:key,secretAccessKey:secret}});
  const bucket=Deno.env.get("R2_PUBLISHED_BUCKET")||"aether-games-published",urls:Record<string,string>={};
  for(const rel of files){if(typeof rel!=="string"||!rel||rel.split("/").some((p:string)=>!p||p==="."||p==="..")||rel.includes("\\"))return json({error:"Invalid package path"},409);urls[rel]=await getSignedUrl(s3,new GetObjectCommand({Bucket:bucket,Key:game.package_path+"/"+rel}),{expiresIn:3600});}
  return json({urls});
 }catch(e){return json({error:String((e as Error)?.message||e)},500)}
});