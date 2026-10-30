const {contextBridge,ipcRenderer}=require("electron");
contextBridge.exposeInMainWorld("aether",{
  login:(email,password)=>ipcRenderer.invoke("aether:login",email,password),
  logout:()=>ipcRenderer.invoke("aether:logout"),
  openExternal:url=>ipcRenderer.invoke("aether:openExternal",url),
  getStore:()=>ipcRenderer.invoke("aether:store"),
  getInstalled:()=>ipcRenderer.invoke("aether:installed"),
  installGame:game=>ipcRenderer.invoke("aether:install",game),
  launchGame:id=>ipcRenderer.invoke("aether:launch",id)
});
