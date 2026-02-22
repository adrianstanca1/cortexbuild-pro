import {
    Client
} from 'ssh2';

const conn = new Client();

const config = {
    host: process.env.SSH_HOST || '194.11.154.108',
    port: parseInt(process.env.SSH_PORT || '65002'),
    username: process.env.SSH_USERNAME || 'u875310796',
    password: process.env.SSH_PASSWORD  // REQUIRED: Set SSH_PASSWORD environment variable
};

// Validate password is provided
if (!config.password) {
    console.error('ERROR: SSH_PASSWORD environment variable is required');
    console.error('Usage: SSH_PASSWORD=your_password node remote_restart.js');
    process.exit(1);
}

const nodePath = '/opt/alt/alt-nodejs20/root/usr/bin/node';
const appDir = '/home/u875310796/domains/cortexbuildpro.com/public_html/api';
// Aggressive kill: kill -9 all node processes for this user
const cmd = `pkill -9 -u u875310796 node; sleep 2; cd ${appDir} && nohup ${nodePath} dist/index.js > app.out 2> app.err &`;

conn.on('ready', () => {
    console.log('SSH Client Ready');
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).connect(config);