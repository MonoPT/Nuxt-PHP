import { defineNuxtModule, addPlugin, createResolver, addComponentsDir } from '@nuxt/kit'
import {spawn } from "child_process";

let fs = require("fs");
let path = require("path");

function ThroughDirectory(directory: string, files: string[], ends_with = ".html") {
  fs.readdirSync(directory).forEach(file => {
      const absolute = path.join(directory, file);
      if (fs.statSync(absolute).isDirectory()) {
          ThroughDirectory(absolute, files, ends_with); // Chamada recursiva para subdiretórios
      } else {
          if (absolute.endsWith(ends_with)) {
              files.push(absolute); // Adiciona o arquivo .html ao array de arquivos
          }
      }
  });
}


// Module options TypeScript interface definition
export interface ModuleOptions {
  port: number
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'Nuxt-php',
    configKey: 'php',
  },
  // Default configuration options of the Nuxt module
  defaults: {
    port: 4000
  },
  setup(_options, nuxt) {
    //@ts-ignore
    const resolver = createResolver(import.meta.url)

    addComponentsDir({
      path: resolver.resolve('runtime/components')
    })

    let generate_php_server = resolver.resolve('./generate_server.js');
    let path_php_bindings = nuxt.options.srcDir + "/.nuxt/php_bindings.json";

    //@ts-ignore
    let serverProcess;

    //@ts-ignore
    if (nuxt.options.dev) {
      addPlugin({
        src: resolver.resolve('./runtime/plugin'),
        mode: "client"
      })
    
      
      let php_server = resolver.resolve('./php_server');

      const phpParserServer = spawn("php", ['-S', 'localhost:8000'], {
        cwd: php_server, // Set current working directory for the child process
      });


      phpParserServer.stdout.on('data', (data) => {
        console.log(`Server stdout: ${data}`);
      });

      phpParserServer.stderr.on('data', (data) => {
        console.error(`Server stderr: ${data}`);
      });

      phpParserServer.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
      });

    }

    nuxt.hook('build:before', () => {
        //const cp = spawn('node', [`${nuxt.options.srcDir}/modules/sv.js`])

        // Spawn a new process for the server
        serverProcess = spawn('node', [generate_php_server, nuxt.options.srcDir]);

        serverProcess.stdout.on('data', (data) => {
          console.log(`Server stdout: ${data}`);
        });

        serverProcess.stderr.on('data', (data) => {
          console.error(`Server stderr: ${data}`);
        });

        serverProcess.on('close', (code) => {
          console.log(`Server process exited with code ${code}`);
        });

        fs.writeFileSync(path_php_bindings, "{}");
    })
    
    nuxt.hook('close', async () => {
        //@ts-ignore
        serverProcess.kill('SIGINT');

        let dir = nuxt.options.srcDir + "/.output/public"

        let files: string[]  = [];

        ThroughDirectory(dir, files);


        let php_bindings = JSON.parse(fs.readFileSync(path_php_bindings, {encoding: "utf-8"}));

        files.forEach(file => {
          let data = fs.readFileSync(file,{ encoding: 'utf8' });

          Object.keys(php_bindings).forEach(php_key => {
            data = data.replaceAll(
              `<div phuuid="${php_key}"><div style="all:unset;"></div></div>`, 
              `<div phuuid="${php_key}"><div style="all:unset;">\n<?php ${php_bindings[php_key]} ?>\n</div></div>`);
          });

          fs.writeFileSync(file.replace(".html", ".php"), data);
          fs.unlinkSync(file);
        });

      let js_files = [];

      ThroughDirectory(dir, js_files, ".js");

      js_files.forEach(path => {
        let script = fs.readFileSync(path,{ encoding: 'utf8' }) as string;

        Object.keys(php_bindings).forEach(php_key => {
          script = script.replace(php_bindings[php_key], "");
        });

        fs.writeFileSync(path, script);
      });

    })

  },
})

