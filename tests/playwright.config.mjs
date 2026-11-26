import {defineConfig} from "@playwright/test"
export default defineConfig({
 testDir:".",testMatch:"*.browser.mjs",workers:1,timeout:45000,
 use:{baseURL:"http://127.0.0.1:4178",viewport:{width:1280,height:800},headless:true},
 webServer:{command:"node tests/server.mjs",cwd:new URL("..",import.meta.url).pathname,url:"http://127.0.0.1:4178",reuseExistingServer:false}
})
