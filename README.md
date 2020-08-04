# videoChat01

## Env
Rename `.env.sample` to `.env` file and populate it with the correct variables
then finally:
```bash
$ source .env
```


## G-Cloud Speech Setup
(optional but can be used for testing) - Install the [G-cloud cLI
tool](https://cloud.google.com/sdk/docs#install_the_latest_cloud_tools_version_cloudsdk_current_version) for your specific OS

1. Visit the [Google Developers Console](https://console.developers.google.com/project)
2. Create a new project or select an existing project.
3. Navigate to  **APIs & auth** > **APIs section** and turn on the **Google Cloud Speech API** (you need to enable billing in order to use the services).
4. Navigate to **APIs & auth** >  **Credentials** to create a service account key:

  - Click on **Create credentials** and select **Service account key**. 

  - You will be prompted to download the created JSON key file that the library uses to authenticate your requests.

  - Add the **absolute path** to your JSON key file in your `.env` file as the `GOOGLE_APPLICATION_CREDENTIALS`
  

## Build Setup

```bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000

$ yarn dev

# build for production and launch server
$ yarn start:prod

# generate static project
$ yarn generate
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
