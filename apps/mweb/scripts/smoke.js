import http from 'node:http'
import { setTimeout as sleep } from 'node:timers/promises'

async function ping(path){
  return new Promise((resolve)=>{
    const req = http.request({ host:'localhost', port:3002, path, method:'GET' }, (res)=>{
      let d='';res.on('data',(c)=>d+=c);res.on('end',()=>resolve({ status:res.statusCode, ok: res.statusCode===200, body:d }))
    }); req.on('error',()=>resolve({ status:0, ok:false })); req.end()
  })
}

async function main(){
  console.log('SMOKE start')
  console.log('Assumes vite preview on :3002')
  let ok=true
  const pages=['/','/categories','/products']
  for (const p of pages){
    const r = await ping(p); console.log(p, r.status)
    if(!r.ok) ok=false
  }
  if(!ok){ console.error('Smoke failed'); process.exit(1) }
  console.log('SMOKE ok')
}
main()
