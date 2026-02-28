19:31:58.659 Running build in Washington, D.C., USA (East) – iad1
19:31:58.659 Build machine configuration: 4 cores, 8 GB
19:31:58.817 Cloning github.com/Convexo-finance/convexo_frontend (Branch: main, Commit: e242c52)
19:31:58.818 Previous build caches not available.
19:31:59.302 Cloning completed: 484.000ms
19:32:00.866 Running "vercel build"
19:32:01.455 Vercel CLI 50.23.2
19:32:01.769 Installing dependencies...
19:32:04.131 npm warn ERESOLVE overriding peer dependency
19:32:04.141 npm warn ERESOLVE overriding peer dependency
19:32:10.567 npm warn ERESOLVE overriding peer dependency
19:32:10.567 npm warn While resolving: @solana/wallet-standard-wallet-adapter-base@1.1.4
19:32:10.568 npm warn Found: bs58@4.0.1
19:32:10.568 npm warn node_modules/bs58
19:32:10.568 npm warn   peer bs58@"^4.0.1" from @particle-network/solana-wallet@1.3.2
19:32:10.568 npm warn   node_modules/@particle-network/solana-wallet
19:32:10.568 npm warn     @particle-network/solana-wallet@"^1.3.2" from @solana/wallet-adapter-particle@0.1.16
19:32:10.568 npm warn     node_modules/@solana/wallet-adapter-particle
19:32:10.568 npm warn   4 more (@project-serum/sol-wallet-adapter, @solana/web3.js, ...)
19:32:10.568 npm warn
19:32:10.568 npm warn Could not resolve dependency:
19:32:10.569 npm warn peer bs58@"^6.0.0" from @solana/wallet-standard-wallet-adapter-base@1.1.4
19:32:10.569 npm warn node_modules/@solana/wallet-standard-wallet-adapter-base
19:32:10.569 npm warn   @solana/wallet-standard-wallet-adapter-base@"^1.1.4" from @solana/wallet-standard-wallet-adapter@1.1.4
19:32:10.569 npm warn   node_modules/@solana/wallet-standard-wallet-adapter
19:32:10.569 npm warn   1 more (@solana/wallet-standard-wallet-adapter-react)
19:32:10.569 npm warn
19:32:10.569 npm warn Conflicting peer dependency: bs58@6.0.0
19:32:10.569 npm warn node_modules/bs58
19:32:10.569 npm warn   peer bs58@"^6.0.0" from @solana/wallet-standard-wallet-adapter-base@1.1.4
19:32:10.569 npm warn   node_modules/@solana/wallet-standard-wallet-adapter-base
19:32:10.569 npm warn     @solana/wallet-standard-wallet-adapter-base@"^1.1.4" from @solana/wallet-standard-wallet-adapter@1.1.4
19:32:10.569 npm warn     node_modules/@solana/wallet-standard-wallet-adapter
19:32:10.570 npm warn     1 more (@solana/wallet-standard-wallet-adapter-react)
19:32:10.710 npm error code ERESOLVE
19:32:10.710 npm error ERESOLVE could not resolve
19:32:10.711 npm error
19:32:10.711 npm error While resolving: eslint-config-next@16.1.6
19:32:10.711 npm error Found: eslint@8.57.1
19:32:10.711 npm error node_modules/eslint
19:32:10.711 npm error   dev eslint@"^8.56.0" from the root project
19:32:10.711 npm error   peer eslint@"^6.0.0 || ^7.0.0 || >=8.0.0" from @eslint-community/eslint-utils@4.9.1
19:32:10.711 npm error   node_modules/@eslint-community/eslint-utils
19:32:10.711 npm error     @eslint-community/eslint-utils@"^4.9.1" from @typescript-eslint/utils@8.56.1
19:32:10.711 npm error     node_modules/@typescript-eslint/utils
19:32:10.711 npm error       @typescript-eslint/utils@"8.56.1" from @typescript-eslint/eslint-plugin@8.56.1
19:32:10.711 npm error       node_modules/@typescript-eslint/eslint-plugin
19:32:10.712 npm error         @typescript-eslint/eslint-plugin@"8.56.1" from typescript-eslint@8.56.1
19:32:10.712 npm error         node_modules/typescript-eslint
19:32:10.712 npm error       2 more (@typescript-eslint/type-utils, typescript-eslint)
19:32:10.712 npm error     @eslint-community/eslint-utils@"^4.2.0" from eslint@8.57.1
19:32:10.712 npm error   10 more (@typescript-eslint/eslint-plugin, ...)
19:32:10.712 npm error
19:32:10.712 npm error Could not resolve dependency:
19:32:10.712 npm error peer eslint@">=9.0.0" from eslint-config-next@16.1.6
19:32:10.712 npm error node_modules/eslint-config-next
19:32:10.712 npm error   dev eslint-config-next@"^16.1.6" from the root project
19:32:10.712 npm error
19:32:10.712 npm error Conflicting peer dependency: eslint@10.0.2
19:32:10.712 npm error node_modules/eslint
19:32:10.713 npm error   peer eslint@">=9.0.0" from eslint-config-next@16.1.6
19:32:10.713 npm error   node_modules/eslint-config-next
19:32:10.713 npm error     dev eslint-config-next@"^16.1.6" from the root project
19:32:10.713 npm error
19:32:10.713 npm error Fix the upstream dependency conflict, or retry
19:32:10.713 npm error this command with --force or --legacy-peer-deps
19:32:10.713 npm error to accept an incorrect (and potentially broken) dependency resolution.
19:32:10.713 npm error
19:32:10.713 npm error
19:32:10.713 npm error For a full report see:
19:32:10.713 npm error /vercel/.npm/_logs/2026-02-28T00_32_02_011Z-eresolve-report.txt
19:32:10.713 npm error A complete log of this run can be found in: /vercel/.npm/_logs/2026-02-28T00_32_02_011Z-debug-0.log
19:32:10.754 Error: Command "npm install" exited with 1