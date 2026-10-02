export function corsHeaders(){
 const origin=process.env.NOVA_FRONTEND_ORIGIN||"*";
 return {"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Vary":"Origin"};
}