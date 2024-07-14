//@ts-ignore
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((_nuxtApp) => {
    window.addEventListener("parse_php", async (e: any) => {
        let payload = e.detail.payload;
        let uuid = e.detail.uuid;

        let response = await fetch("http://localhost:8000", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        let data = await response.text();


        window.dispatchEvent(new CustomEvent("php_response", {
            detail: {
                uuid,
                data
            }
        }))
    })
})
