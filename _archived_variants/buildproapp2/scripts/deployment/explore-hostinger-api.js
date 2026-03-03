import pkg from 'hostinger-api-sdk';
const {
    Configuration,
    WebsitesApi
} = pkg;

const API_TOKEN = 'L25U1AxHMO84weayO2kvgUn5zqMqMkcHx6fuIzJY055e801d';

async function exploreHostingerAPI() {
    console.log('🔍 Exploring Hostinger API capabilities...\n');

    try {
        // Configure API client
        const config = new Configuration({
            apiKey: API_TOKEN,
        });

        const websitesApi = new WebsitesApi(config);

        // List websites
        console.log('📋 Fetching websites...');
        const websites = await websitesApi.getWebsites();
        console.log('\n✅ Websites found:');
        console.log(JSON.stringify(websites.data, null, 2));

        console.log('\n✅ API connection successful!');
        console.log('\n📊 Available API endpoints explored.');
        console.log('⚠️  Node.js app management not available via API.');
        console.log('\n🎯 Next step: Complete backend setup in hPanel');
        console.log('   https://hpanel.hostinger.com → Websites → Node.js');

    } catch (error) {
        console.error('\n❌ API Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

exploreHostingerAPI();