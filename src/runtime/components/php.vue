<template>
    <DevOnly>
        <div style="all: unset">{{ php_data }}</div>
    </DevOnly>
    <div :phUUid="element_uuid"><div v-pre style="all: unset;"></div></div>
</template>

<script lang="ts" setup>
    import { v4 as uuidv4 } from 'uuid';
    import {onMounted, ref} from "vue"

    let element_uuid = "php-" + uuidv4();
    let php_data = ref('loading...');

    //@ts-ignore
    if(import.meta.client && import.meta.dev) {
        onMounted(async () => {
            let uuid = uuidv4();

            let slot_data = "";

            //@ts-ignore
            useSlots().default().forEach(slot => {
                if (!slot.el) {
                    slot_data += slot.children;
                } else {
                    slot_data += (slot.el as HTMLElement).outerHTML;
                }
            });

            window.addEventListener("php_response", (e: any) => {
                if (e.detail.uuid === uuid) {
                    php_data.value = e.detail.data;
                }
            })

            

            window.dispatchEvent(new CustomEvent("parse_php", {
                detail: {
                    payload: slot_data,
                    uuid
                }
            }))
        })

        //@ts-ignore
    } else if(import.meta.server && !import.meta.dev) {
        let slot_data = "";

        //@ts-ignore
        useSlots().default().forEach(slot => {
            if (!slot.el) {
                slot_data += slot.children;
            } else {
                slot_data += (slot.el as HTMLElement).outerHTML;
            }
        });

        let body = JSON.stringify({
                uuid: element_uuid,
                data: slot_data
        })

        //@ts-ignore
        await fetch("http://localhost:4000", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body
        })

    }
</script>