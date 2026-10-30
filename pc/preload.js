const {contextBridge,ipcRenderer}=require("electron");
contextBridge.exposeInMainWorld("aether",{
  getStore:()=>ipcRenderer.invoke("aether:store"),
  getInstalled:()=>ipcRenderer.invoke("aether:installed"),
  installGame:game=>ipcRenderer.invoke("aether:install",game),
  launchGame:id=>ipcRenderer.invoke("aether:launch",id)
});
