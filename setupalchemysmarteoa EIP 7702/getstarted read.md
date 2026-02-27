React Quickstart
Create a new app with embedded wallets, social login, and gasless transactions.

preview-img

You can also follow the Quickstart in the Dashboard.


1. Clone template repo
npx create-next-app my-smart-wallets-app -e https://github.com/alchemyplatform/smart-wallets-quickstart
cd my-smart-wallets-app


2. Set up environment
Once you have your project cloned down and you are in the my-smart-wallets-app level in your terminal, go to your project's root, create a .env file and copy-paste the following into it:

# Paste this in your .env file
NEXT_PUBLIC_ALCHEMY_API_KEY=YOUR_ALCHEMY_API_KEY
NEXT_PUBLIC_ALCHEMY_POLICY_ID=YOUR_PAYMASTER_POLICY_ID

Remember: you must create a Configuration and a Paymaster Policy if you want to use Smart Wallets.

Both the Configuration and the Policy ID must be linked to the application behind your API Key!


3. Run app
In your terminal, run:

npm run dev

Your localhost:3000 should now display the following:

preview


4. Log in and view the app
You can use a service like Temp Mail to test logins with throwaway email accounts.

Note: Social login will not work just yet!

Once you use an email, you will receive a 6-digit authentication code. Copy-paste it into the following screen:

code-view

Once you have signed in, you can mint your own NFT! 🎉

mint-nft-view


5. Next steps
You're all set to take your app to the next level with transactions!

In the Dashboard, you can set your app up with:

Swaps!
Social login methods
Gas sponsorship
Customized styling