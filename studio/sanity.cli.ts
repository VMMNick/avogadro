import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '26imwxcy',
    dataset: 'production'
  },
  studioHost: 'avohadro',
  deployment: {
    appId: 'ugsvtghd023mely8c7xq6kys',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
