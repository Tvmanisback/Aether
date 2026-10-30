import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:cors});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"POST required"},405);
 try{
  const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,auth=req.headers.get("Authorization")||"";
  const caller=createClient(url,Deno.env.get("SUPABASE_ANON_KEY")||"",{global:{headers:{Authorization:auth}}}),admin=createClient(url,service);
  const {data:{user}}=await caller.auth.getUser();if(!user)return json({error:"Sign in required"},401);
  const {game_id,title,description,age_rating,cover_url,banner_url,title_font}=await req.json();
  if(!game_id||typeof title!=="string"||!title.trim()||title.length>80||typeof description!=="string"||!description.trim()||description.length>2000||!["13+","16+","18+"].includes(age_rating))return json({error:"Provide a title, description, and valid age rating."},400);
  const {data:game}=await admin.from("games").select("id,developer_id").eq("id",game_id).eq("status","approved").maybeSingle();
  if(!game||game.developer_id!==user.id)return json({error:"You can only edit your own approved games."},403);
  const allowedFonts=["Space Grotesk","DM Sans","Orbitron","Rajdhani","Bebas Neue","Press Start 2P","Audiowide","Cinzel","Oswald","Montserrat"];
  if(title_font!==undefined&&!allowedFonts.includes(title_font))return json({error:"Choose a supported game title font."},400);
  for(const value of [cover_url,banner_url])if(value!==undefined&&value!==null&&(typeof value!=="string"||!value.startsWith("https://")))return json({error:"Artwork URL must be HTTPS."},400);
  const update={title:title.trim(),description:description.trim(),age_rating};
  if(cover_url!==undefined)update.cover_url=cover_url;
  if(banner_url!==undefined)update.banner_url=banner_url;
  if(title_font!==undefined)update.title_font=title_font;
  const {error}=await admin.from("games").update(update).eq("id",game_id);
  if(error)throw error;
  return json({ok:true});
 }catch(e){console.error("edit-game failed:",e);return json({error:String((e as Error)?.message||e)},500)}
});