import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-aether-public-key","Access-Control-Allow-Methods":"POST, OPTIONS"};
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return Response.json({error:"POST required"},{status:405,headers:cors});
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth=req.headers.get("Authorization")||"";
  const caller=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const admin=createClient(url,service);
  const {data:{user},error:userError}=await caller.auth.getUser();
  if(userError||!user)return Response.json({error:"A valid signed-in Aether user session is required."},{status:401,headers:cors});
  const key=req.headers.get("x-aether-public-key")||"";
  const body=await req.json().catch(()=>({}));
  if(!/^aether_pk_[a-f0-9]{64}$/.test(key)||!body.game_id)return Response.json({error:"Invalid game authentication details."},{status:400,headers:cors});
  const {data:game,error}=await admin.from("games").select("id,title,developer_public_key,status").eq("id",body.game_id).eq("status","approved").maybeSingle();
  if(error||!game||game.developer_public_key!==key)return Response.json({error:"This game key is not valid for this published game."},{status:403,headers:cors});
  return Response.json({authenticated:true,user_id:user.id,game_id:game.id,game_title:game.title},{headers:{...cors,"Cache-Control":"no-store"}});
});
