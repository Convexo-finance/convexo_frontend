Export configuration
Code preview

To get started, simply paste the below code into your environment. You'll need to add your Alchemy API key and Gas Policy ID. Fully customize styling here.

Config
Pass this config object into the AlchemyAccountProvider.


src/app/config.ts...

import { AlchemyAccountsUIConfig, createConfig } from "@account-kit/react";
import { sepolia, alchemy } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [[{"type":"email"}],[{"type":"passkey"},{"type":"social","authProviderId":"google","mode":"popup"}],[{"type":"external_wallets","walletConnect":{"projectId":"30e7ffaff99063e68cc9870c105d905b"},"wallets":["wallet_connect","coinbase wallet"],"chainType":["svm","evm"],"moreButtonText":"More wallets","hideMoreButton":false,"numFeaturedWallets":1}]],
    addPasskeyOnSignup: true,
    header: <img src="path/to/logo.svg" />,
  },
  supportUrl: "support@convexo.xyz"
};

export const config = createConfig({
  // if you don't want to leak api keys, you can proxy to a backend and set the rpcUrl instead here
  // get this from the app config you create at https://dashboard.alchemy.com/apps/latest/services/smart-wallets?utm_source=demo_alchemy_com&utm_medium=referral&utm_campaign=demo_to_dashboard
  transport: alchemy({ apiKey: "your-api-key" }),
  chain: sepolia,
  ssr: true, // set to false if you're not using server-side rendering
enablePopupOauth: true,
}, uiConfig);

export const queryClient = new QueryClient();



Style
Not using tailwind? Follow this guide to get started, then add the below code to your config file.

import { withAccountKitUi, createColorSet } from "@account-kit/react/tailwind";

// wrap your existing tailwind config with 'withAccountKitUi'
export default withAccountKitUi({
  // your tailwind config here
  // if using tailwind v4, this can be left empty since most options are configured via css
  // if using tailwind v3, add your existing tailwind config here - https://v3.tailwindcss.com/docs/installation/using-postcss
}, {
  // override account kit themes
  colors: {
    "btn-primary": createColorSet("#363FF9", "#000000"),
    "fg-accent-brand": createColorSet("#363FF9", "#000000"),
  },
  borderRadius: "lg",
})
